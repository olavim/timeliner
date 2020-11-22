import * as React from 'react';
import {findDOMNode} from 'react-dom';
import axios, {AxiosInstance} from 'axios';
import {cloneDeep, pick, debounce} from 'lodash';
import {
	createStyles,
	WithStyles,
	withStyles,
	CircularProgress,
	IconButton,
	Button,
	Fab,
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	DialogActions
} from '@material-ui/core';
import withMobileDialog, {InjectedProps as WithMobileDialog} from '@material-ui/core/withMobileDialog';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';
import WebFont from 'webfontloader';
import FileSaver from 'file-saver';
import MenuIcon from '@material-ui/icons/Menu';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import FileTreeIcon from '@material-ui/icons/FolderOpen';
import DownloadIcon from '@material-ui/icons/GetApp';
import githubIcon from './github-32px.png';
import BlockList, {BlockData} from './BlockList';
import withAuth, {WithAuthProps} from '@/hocs/with-auth';
import isMobile from '@/lib/is-mobile';
import MenuDrawer from '@/MenuDrawer';
import FileTreeDrawer from '@/FileTreeDrawer';
import MoveBlockUpIcon from './images/move-block-up.svg';
import MoveBlockDownIcon from './images/move-block-down.svg';
import AddBlockAboveIcon from './images/add-block-above.svg';
import AddBlockBelowIcon from './images/add-block-below.svg';
import IndentIcon from './images/indent-block.svg';
import OutdentIcon from './images/outdent-block.svg';
import AddTitleIcon from './images/add-title.svg';
import AddBodyIcon from './images/add-body.svg';
import RemoveTitleIcon from './images/remove-title.svg';
import RemoveBodyIcon from './images/remove-body.svg';
import ColorChooserIcon from './images/color-chooser.svg';
import RemoveBlockIcon from './images/remove-block.svg';
import MoveColumnRightIcon from './images/move-column-right.svg';
import MoveColumnLeftIcon from './images/move-column-left.svg';
import MoveRowUpIcon from './images/move-row-up.svg';
import MoveRowDownIcon from './images/move-row-down.svg';
import AddColumnLeftIcon from './images/add-column-left.svg';
import AddColumnRightIcon from './images/add-column-right.svg';
import AddRowAboveIcon from './images/add-row-above.svg';
import AddRowBelowIcon from './images/add-row-below.svg';
import RemoveColumnIcon from './images/remove-column.svg';
import RemoveRowIcon from './images/remove-row.svg';

const styles = createStyles({
	root: {
		display: 'flex',
		flexDirection: 'row',
		height: '100%',
		backgroundColor: '#fafafa'
	},
	container: {
		display: 'flex',
		flexDirection: 'column',
		textAlign: 'center',
		flex: '1 1 auto',
		overflow: 'hidden'
	},
	newColumnBtn: {
		margin: '1rem',
		padding: '1rem',
		minWidth: 0,
		minHeight: 0
	},
	appBar: {
		display: 'flex',
		backgroundColor: '#ffffff',
		flex: '0 0 5rem',
		padding: '0 2rem',
		justifyContent: 'flex-start',
		alignItems: 'center',
		boxShadow: '0 0 0.6rem 0 rgba(0,0,0,0.4)',
		zIndex: 100,
		'& .timeline': {
			marginRight: '1rem',
			minHeight: '2.6rem'
		},
		[`@media (max-height: 500px) and (orientation:landscape)`]: {
			padding: '0 1rem'
		}
	},
	controlBar: {
		display: 'flex',
		backgroundColor: '#ffffff',
		flex: '0 0 5rem',
		padding: '0 2rem',
		justifyContent: 'flex-start',
		alignItems: 'center',
		boxShadow: '0 0 0.6rem 0 rgba(0,0,0,0.4)'
	},
	menuButton: {
		padding: '0.6rem',
		'@media (min-width: 960px)': {
			display: 'none'
		}
	},
	fileTreeButton: {
		padding: '0.6rem',
		'@media (min-width: 960px)': {
			display: 'none'
		}
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		flex: '1 1 auto',
		overflowY: 'scroll',
		overflowX: 'scroll'
	},
	contentRow: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		flex: '1 1 auto',
		alignItems: 'flex-start'
	},
	progressOverlay: {
		width: '100%',
		height: '100%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 0,
		left: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.5)',
		zIndex: 2000
	},
	drawerContainer: {
		zIndex: 1000,
		'@media (min-width: 960px)': {
			flex: '0 0 22%',
			width: '22%',
			maxWidth: '24rem',
			minWidth: '15rem',
			boxShadow: '0 0 2rem 0 rgba(0,0,0,0.13)'
		}
	},
	dialogTitle: {
		fontSize: '1.6rem',
		fontWeight: 600,
		color: 'rgba(0,0,0,0.87)'
	},
	dialogButton: {
		fontSize: '1.3rem',
		fontWeight: 600,
		color: '#2196f3'
	},
	noDocumentContainer: {
		padding: '5rem',
		'& button': {
			backgroundColor: '#5e8fc5',
			fontSize: '1.2rem',
			color: '#fff',
			fontWeight: 600,
			'&:hover': {
				backgroundColor: '#6596cc'
			},
			'& svg': {
				marginRight: '0.8rem'
			}
		}
	},
	downloadDialog: {
		backgroundColor: 'transparent',
		overflowY: 'visible',
		boxShadow: 'none',
		'& button': {
			backgroundColor: '#5e8fc5',
			fontSize: '1.2rem',
			color: '#fff',
			fontWeight: 600,
			'&:hover': {
				backgroundColor: '#6596cc'
			},
			'& svg': {
				marginRight: '0.8rem'
			}
		}
	},
	blockActionContainer: {
		margin: '0 1rem',
		padding: '0',
		display: 'none',
		flex: '1 1 auto',
		borderLeft: '1px solid rgba(0, 0, 0, 0.11)',
		borderRight: '1px solid rgba(0, 0, 0, 0.11)',
		justifyContent: 'space-around',
		[`@media (max-height: 500px) and (orientation:landscape)`]: {
			display: 'flex'
		}
	},
	blockAction: {
		backgroundColor: 'transparent',
		fontSize: '1rem',
		border: 'none',
		fontWeight: 700,
		color: 'rgba(0,0,0,0.73)',
		flex: '0 1 0',
		padding: '9px 0.2rem',
		'&:disabled': {
			color: 'rgba(0,0,0,0.47)'
		},
		'& svg': {
			fontSize: '1.8rem'
		}
	}
});

export type Timeline = Array<{
	title: string;
	columns: BlockData[][];
}>;

export interface ListTimeline {
	id: string;
	name: string;
	createdAt: string;
	updatedAt?: string;
}

export interface GetTimeline {
	data: Timeline;
	id?: string;
	name?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface State {
	fontsLoaded: boolean;
	timeline?: GetTimeline;
	availableTimelines: ListTimeline[];
	nameStr: string;
	loading: boolean;
	exporting: boolean;
	showDrawer: boolean;
	showFileTree: boolean;
	showOpenDialog: boolean;
	showRenameDialog: boolean;
	showNewDialog: boolean;
	showConfirmDialog: boolean;
	downloadData: {blob: Blob; filename: string} | null;
	appBarActions: any[];
}

type AppProps = WithMobileDialog & WithStyles<typeof styles> & WithAuthProps;

class App extends React.Component<AppProps, State> {
	public listContainerRef = React.createRef<any>();
	public listRef = React.createRef<any>();
	public api: AxiosInstance;

	public state: State = {
		fontsLoaded: false,
		availableTimelines: [],
		nameStr: '',
		loading: true,
		exporting: false,
		showDrawer: false,
		showFileTree: false,
		showOpenDialog: false,
		showRenameDialog: false,
		showNewDialog: false,
		showConfirmDialog: false,
		downloadData: null,
		appBarActions: []
	};

	constructor(props: AppProps) {
		super(props);
		this.api = axios.create({
			baseURL: window.env.API_URL
		});
		this.api.interceptors.request.use(async config => {
			const token = await this.props.auth.getTokenSilently();
			config.headers = {Authorization: `Bearer ${token}`};
			return config;
		});
	}

	public componentDidMount() {
		if (
			'serviceWorker' in navigator &&
			window.location.protocol === 'https:'
			// Sw is disabled in localhost because of hmr
			// (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
		) {
			runtime.register();
		}

		WebFont.load({
			google: {
				families: ['Montserrat:400,600,700', 'Roboto Mono:400,500']
			},
			active: () => {
				this.setState({fontsLoaded: true});
			}
		});

		if (this.props.auth.isAuthenticated) {
			this.handleList(true);
		} else {
			const data = localStorage.getItem('timeliner-data');
			this.setState({
				timeline: data ? JSON.parse(data) : {data: [{title: '', columns: [[]]}]},
				loading: false
			});
		}
	}

	public componentDidUpdate(_prevProps: any, prevState: State) {
		if (!prevState.fontsLoaded && this.state.fontsLoaded) {
			setTimeout(() => {
				window.requestAnimationFrame(() => {
					const elem = findDOMNode(this.listContainerRef.current) as HTMLElement;
					if (elem) {
						elem.scrollTo(0, 0);
					}
				});
			}, 0);
		}
	}

	public getBlockChangeHandler = (row: number, col: number) => (data: BlockData[]) => {
		const timeline = cloneDeep(this.state.timeline);
		timeline!.data[row].columns[col] = data;

		if (this.props.auth.isAuthenticated) {
			this.handleSave();
		} else {
			localStorage.setItem('timeliner-data', JSON.stringify(timeline));
		}

		this.setState({timeline});
	}

	public handleImportTimeline = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const fileElem = evt.target;
		if (fileElem && fileElem.files && fileElem.files[0]) {
			const file = fileElem.files[0];
			const reader = new FileReader();
			reader.readAsText(file, 'UTF-8');
			reader.onload = async () => {
				const data = reader.result as string;
				const newTimeline = {
					name: file.name.replace(/\.[^/.]+$/, '') || 'untitled',
					data: JSON.parse(data)
				};

				let timeline: GetTimeline;

				if (this.props.auth.isAuthenticated) {
					const {data} = await this.api.post('/timelines', newTimeline);
					timeline = data.timeline;
				} else {
					timeline = newTimeline;
				}

				this.setState({timeline, showDrawer: false}, () => {
					localStorage.setItem('timeliner-data', JSON.stringify(timeline));

					if (this.props.auth.isAuthenticated) {
						this.handleList();
					}
				});
			};
		}
	}

	public handleExportPDF = (_width: number, _height: number, _margin: number) => {
		// Not implemented
	}

	public handleExportText = () => {
		// Not implemented
	}

	public handleExportTimeline = () => {
		const timeline = this.state.timeline;
		this.setDownloadData(`${timeline!.name || 'timeline'}.cbo`, JSON.stringify(timeline!.data));
	}

	public setDownloadData = (filename: string, data: string | Blob) => {
		const blob = typeof data === 'string' ? new Blob(['\ufeff', data]) : data;

		if (isMobile.iOS()) {
			this.setState({downloadData: {blob, filename}, showDrawer: false});
		} else {
			FileSaver.saveAs(blob, filename);
		}
	}

	public handleDownload = () => {
		const {blob, filename} = this.state.downloadData!;
		FileSaver.saveAs(blob, filename);
		this.setState({downloadData: null});
	}

	public handleToggleDrawer = (showDrawer: boolean) => () => {
		this.setState({showDrawer});
	}

	public handleToggleFileTree = (open: boolean) => (evt: any) => {
		if (evt && evt.type === 'keydown' && (evt.key === 'Tab' || evt.key === 'Shift')) {
			return;
		}

		this.setState({showFileTree: open});
	}

	public handleOpenNewDialog = () => {
		this.setState({showNewDialog: true});
	}

	public handleCloseNewDialog = () => {
		this.setState({showNewDialog: false, nameStr: ''});
	}

	public handleChangeNameStr = (evt: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({nameStr: evt.target.value});
	}

	public handleClearNameStr = () => {
		this.setState({nameStr: ''});
	}

	public handleClearDownloadData = () => {
		this.setState({downloadData: null});
	}

	public handleNew = async (name: any) => {
		const newTimeline = {
			data: [{title: '', columns: [[]]}],
			name: typeof name === 'string' ? name : this.state.nameStr
		};
		const {data} = await this.api.post('/timelines', newTimeline);

		const timeline = data.timeline;
		localStorage.setItem('timeliner-data', JSON.stringify(timeline));
		this.setState({timeline, showNewDialog: false}, () => {
			this.handleList();
		});
	}

	public handleOpen = async (id: string) => {
		const {data} = await this.api.get(`/timelines/${id}`);

		const timeline = data.timeline;
		localStorage.setItem('timeliner-data', JSON.stringify(timeline));
		this.setState({timeline, showOpenDialog: false, loading: false});
	}

	public handleList = async (firstLoad: boolean = false) => {
		const {data} = await this.api.get('/timelines');
		const timelines = data.timelines as ListTimeline[];

		if (!firstLoad && timelines.length === 0) {
			return this.setState({availableTimelines: timelines, timeline: undefined});
		}

		this.setState({availableTimelines: timelines}, () => {
			let timeline: GetTimeline | undefined;

			if (firstLoad) {
				const data = localStorage.getItem('timeliner-data');
				if (data) {
					timeline = JSON.parse(data);
				}
			} else {
				timeline = this.state.timeline;
			}

			if (timeline && timelines.find(o => o.id === timeline!.id)) {
				this.handleOpen(timeline.id!);
			} else if (timelines.length > 0) {
				this.handleOpen(timelines[0].id);
			} else {
				this.setState({loading: false});
			}
		});
	}

	public handleSave = debounce(async () => {
		const timeline = this.state.timeline;
		const {data} = await this.api.patch(`/timelines/${timeline!.id}`, pick(timeline, ['name', 'data']));

		localStorage.setItem('timeliner-data', JSON.stringify(data.timeline));

		if (!timeline!.id) {
			this.setState({timeline: data.timeline});
		}
	}, 500);

	public handleRename = async (name: string) => {
		await this.api.patch(`/timelines/${this.state.timeline!.id}`, {name});

		this.setState({showRenameDialog: false}, () => {
			this.handleList();
		});
	}

	public handleDelete = async () => {
		if (!this.props.auth.isAuthenticated) {
			const timeline = {data: []};
			return this.setState({timeline, showConfirmDialog: false, showDrawer: false}, () => {
				localStorage.setItem('timeliner-data', JSON.stringify(timeline));
			});
		}

		const timeline = this.state.timeline;
		await this.api.delete(`/timelines/${timeline!.id}`);

		this.setState({showConfirmDialog: false}, () => this.handleList());
	}

	public handleLogout = () => {
		localStorage.setItem('timeliner-data', JSON.stringify({data: []}));
		this.props.auth.logout({returnTo: window.location.origin});
	}

	public handleFocusBlock = (ref: React.RefObject<any>) => {
		this.setState({appBarActions: ref.current ? ref.current.getActions() : []});
	}

	public getNewColumnHandler = (index: number) => () => {
		this.setState(state => {
			const newData = state.timeline!.data.map(row => {
				const newRow = cloneDeep(row);
				newRow.columns.splice(index, 0, []);
				return newRow;
			});

			return {timeline: {...state.timeline, data: newData}};
		});
	}

	public render() {
		const {classes, fullScreen, auth} = this.props;
		const {
			timeline,
			showDrawer,
			showFileTree,
			fontsLoaded,
			loading,
			exporting,
			availableTimelines,
			showNewDialog,
			nameStr,
			downloadData,
			appBarActions
		} = this.state;

		if (!fontsLoaded || loading || auth.loading) {
			return (
				<div className={classes.progressOverlay}>
					<CircularProgress disableShrink/>
				</div>
			);
		}

		return (
			<div className={classes.root}>
				{exporting && (
					<div className={classes.progressOverlay}>
						<CircularProgress disableShrink/>
					</div>
				)}
				<div className={classes.drawerContainer}>
					<MenuDrawer
						variant={auth.isAuthenticated ? 'temporary' : 'responsive'}
						fullScreen={fullScreen}
						open={showDrawer}
						onClose={this.handleToggleDrawer(false)}
						onNew={this.handleDelete}
						onImport={this.handleImportTimeline}
						onExportTimeline={this.handleExportTimeline}
						onExportPDF={this.handleExportPDF}
						onExportText={this.handleExportText}
					/>
					{auth.isAuthenticated && (
						<FileTreeDrawer
							fullScreen={fullScreen}
							open={showFileTree}
							onOpenMenu={this.handleToggleDrawer(true)}
							onOpen={this.handleToggleFileTree(true)}
							onClose={this.handleToggleFileTree(false)}
							onNewTimeline={this.handleNew}
							onRenameTimeline={this.handleRename}
							onOpenTimeline={this.handleOpen}
							onDeleteTimeline={this.handleDelete}
							timelines={availableTimelines}
							timeline={timeline}
						/>
					)}
				</div>
				<div className={classes.container}>
					<div className={classes.appBar}>
						<IconButton onClick={this.handleToggleDrawer(true)} className={classes.menuButton}>
							<MenuIcon/>
						</IconButton>
						{auth.isAuthenticated && (
							<IconButton onClick={this.handleToggleFileTree(true)} className={classes.fileTreeButton}>
								<FileTreeIcon/>
							</IconButton>
						)}
						<div className={classes.blockActionContainer}>
							{appBarActions.map((a: any) => (
								a.icon ? (
									<IconButton key={a.label} onClick={a.fn} disabled={a.disabled} className={classes.blockAction}>
										<a.icon/>
									</IconButton>
								) : (
									<button key={a.label} onClick={a.fn} disabled={a.disabled} className={classes.blockAction}>
										{a.label}
									</button>
								)
							))}
						</div>
						{auth.isAuthenticated ? (
							<Button
								style={{marginLeft: 'auto', padding: '1.2rem', fontSize: '1.2rem', whiteSpace: 'nowrap'}}
								onClick={this.handleLogout}
							>
								Log out
							</Button>
						) : (
							<Button
								style={{marginLeft: 'auto', padding: '1.2rem', fontSize: '1.2rem', whiteSpace: 'nowrap'}}
								onClick={auth.loginWithRedirect}
							>
								Log in
							</Button>
						)}
						<IconButton
							style={{padding: '1.2rem'}}
							component="a"
							href="https://github.com/olavim/timeliner"
							target="github"
						>
							<img src={githubIcon} style={{height: '2.4rem'}}/>
						</IconButton>
					</div>
					<div className={classes.controlBar}>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveBlockUpIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveBlockDownIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddBlockAboveIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddBlockBelowIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={IndentIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={OutdentIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddTitleIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={RemoveTitleIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddBodyIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={RemoveBodyIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={ColorChooserIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={RemoveBlockIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveColumnRightIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveColumnLeftIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveRowUpIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={MoveRowDownIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddColumnLeftIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddColumnRightIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddRowAboveIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={AddRowBelowIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={RemoveColumnIcon} style={{width: '24px'}}/>
						</IconButton>
						<IconButton style={{padding: '0.75rem'}}>
							<img src={RemoveRowIcon} style={{width: '24px'}}/>
						</IconButton>
					</div>
					<div className={classes.content} ref={this.listContainerRef}>
						{timeline ? (
							timeline.data.map((blockLists, row) => (
								<div className={classes.contentRow} key={row}>
									<Button onClick={this.getNewColumnHandler(0)} className={classes.newColumnBtn}>
										+
									</Button>
									{blockLists.columns.map((list, col) => (
										<React.Fragment key={`${row}:${col}`}>
											<BlockList
												fullScreen={fullScreen}
												blocks={list}
												onChange={this.getBlockChangeHandler(row, col)}
												onFocusBlock={this.handleFocusBlock}
											/>
											<Button onClick={this.getNewColumnHandler(col + 1)} className={classes.newColumnBtn}>
												+
											</Button>
										</React.Fragment>
									))}
								</div>
							))
						) : (
							<div className={classes.noDocumentContainer}>
								<Fab variant="extended" onClick={this.handleOpenNewDialog}>
									<FileIcon/>
									New Document
								</Fab>
							</div>
						)}
					</div>
				</div>
				<Dialog
					fullScreen={fullScreen}
					open={showNewDialog}
					onClose={this.handleCloseNewDialog}
					onExited={this.handleClearNameStr}
					fullWidth
				>
					<DialogTitle disableTypography className={classes.dialogTitle}>{"New document"}</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							fullWidth
							value={nameStr}
							onChange={this.handleChangeNameStr}
							placeholder="untitled"
							InputProps={{style: {fontSize: '1.4rem', fontFamily: 'inherit'}}}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={this.handleCloseNewDialog} color="primary" className={classes.dialogButton}>
							Cancel
						</Button>
						<Button
							onClick={this.handleNew}
							color="primary"
							className={classes.dialogButton}
							disabled={!nameStr}
						>
							Create
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog
					open={Boolean(downloadData)}
					onClose={this.handleClearDownloadData}
					classes={{paper: classes.downloadDialog}}
				>
					<Fab variant="extended" onClick={this.handleDownload} color="primary">
						<DownloadIcon/>
						Download File
					</Fab>
				</Dialog>
			</div>
		);
	}
}

export default withMobileDialog()(withAuth(withStyles(styles)(App)));
