import '@babel/polyfill';

import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import knex from 'knex';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import axios from 'axios';

import 'express-async-errors';

dotenv.config({path: path.resolve(__dirname, '../.env')});

class FetchCache {
	constructor(fn, ttl) {
		this.fn = fn;
		this.ttl = ttl;
		this.cache = new Map();
	}

	async fetch(...args) {
		const key = JSON.stringify(args);
		if (this.cache.has(key)) {
			return this.cache.get(key);
		}

		const response = await this.fn(...args);

		setTimeout(() => this.cache.delete(key), this.ttl);
		this.cache.set(key, response);
		return response;
	}
}

const userInfoStore = new FetchCache(async authz => {
	const res = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
		headers: {Authorization: authz}
	});
	return res.data;
}, 60000);

const pg = knex({
	client: 'pg',
	connection: {
		host: process.env.PG_HOST,
		user: process.env.PG_USER,
		password: process.env.PG_PASS,
		database: process.env.PG_DATABASE
	}
});

const checkJwt = jwt({
	secret: jwksRsa.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
	}),

	audience: process.env.AUTH0_AUDIENCE,
	issuer: `https://${process.env.AUTH0_DOMAIN}/`,
	algorithm: ['RS256']
});

const userInfo = (req, _res, next) => {
	userInfoStore.fetch(req.headers.authorization)
		.then(data => {
			req.user = data;
			next();
		})
		.catch(err => {
			next(err);
		});
};

const noCache = (_req, res, next) => {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Pragma', 'no-cache');
	res.header('Expires', '0');
	next();
};

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(noCache);

app.get('/', (req, res) => {
	res.json({status: 'ok'});
});

app.get('/timelines', [checkJwt, userInfo], async (req, res) => {
	const timelines = await pg('timeliner.timeline')
		.select(['id', 'name', 'created_at', 'updated_at'])
		.where('user_email', req.user.email)
		.orderBy('created_at', 'desc');

	res.json({timelines: timelines.map(t => ({
		id: t.id,
		name: t.name,
		createdAt: t.created_at,
		updatedAt: t.updated_at
	}))});
});

app.get('/timelines/:id', [checkJwt, userInfo], async (req, res) => {
	const timelines = await pg('timeliner.timeline')
		.where('user_email', req.user.email)
		.where('id', req.params.id);

	const t = timelines[0];

	res.json({
		timeline: {
			id: t.id,
			name: t.name,
			data: t.data,
			createdAt: t.created_at,
			updatedAt: t.updated_at
		}
	});
});

app.post('/timelines', [checkJwt, userInfo], async (req, res) => {
	const timelines = await pg('timeliner.timeline')
		.insert({
			user_email: req.user.email, // eslint-disable-line camelcase
			name: req.body.name,
			data: JSON.stringify(req.body.data)
		})
		.returning('*');

	res.json({timeline: timelines[0]});
});

app.patch('/timelines/:id', [checkJwt, userInfo], async (req, res) => {
	const timelines = await pg('timeliner.timeline')
		.where('user_email', req.user.email)
		.where('id', req.params.id)
		.update({
			name: req.body.name,
			data: JSON.stringify(req.body.data)
		})
		.returning('*');

	res.json({timeline: timelines[0]});
});

app.delete('/timelines/:id', [checkJwt, userInfo], async (req, res) => {
	await pg('timeliner.timeline')
		.where('user_email', req.user.email)
		.where('id', req.params.id)
		.delete();

	res.json({status: 'ok'});
});

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, () => {
	console.log(`Server listening on port: ${port}`);
});
