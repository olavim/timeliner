import * as React from 'react';
import {DragLayer, XYCoord} from 'react-dnd';
import {DragLayerMonitor} from 'react-dnd';
import {createStyles, WithStyles, withStyles} from '@material-ui/core';
import {BlockData} from './Block';

function collect(monitor: DragLayerMonitor) {
	return {
		item: monitor.getItem(),
		currentOffset: monitor.getSourceClientOffset(),
		isDragging: monitor.isDragging()
	};
}

function getItemStyles(currentOffset: XYCoord | null): React.CSSProperties {
	if (!currentOffset) {
		return {display: 'none'};
	}

	const x = currentOffset.x;
	const y = currentOffset.y;
	const transform = `translate(${x}px, ${y}px)`;

	return {
		pointerEvents: 'none',
		transform,
		WebkitTransform: transform
	};
}

const styles = createStyles({
	root: {
		position: 'absolute',
		top: 0,
		boxShadow: '0 1px 0.1rem 0 rgba(0,0,0,0.2)',
		overflow: 'hidden',
		borderRadius: '0.4rem',
		backgroundColor: '#fafafa',
		cursor: 'grabbing',
		pointerEvents: 'none',
		zIndex: 100
	},
	title: {
		minHeight: '1.5rem',
		paddingRight: '2rem',
		overflow: 'hidden',
		opacity: 0.8,
		'& pre': {
			padding: '0.6rem',
			minHeight: '1.5rem',
			whiteSpace: 'pre-wrap',
			margin: 0,
			fontWeight: 500,
			fontFamily: `'Roboto Mono', 'Courier New', Courier, monospace`,
			fontSize: '11px'
		}
	},
	body: {
		minHeight: '1.5rem',
		overflow: 'hidden',
		paddingRight: '2rem',
		opacity: 0.8,
		'& pre': {
			padding: '0.6rem',
			minHeight: '1.5rem',
			whiteSpace: 'pre-wrap',
			margin: 0,
			fontFamily: `'Roboto Mono', 'Courier New', Courier, monospace`,
			fontSize: '11px'
		}
	}
});

interface CollectedProps {
	item: any;
	isDragging: boolean;
	currentOffset: XYCoord | null;
}

type Props = CollectedProps & WithStyles<typeof styles>;

const BlockPreview = withStyles(styles)(({item, isDragging, currentOffset, classes}: Props) => {
	if (!isDragging || !item || !item.block) {
		return null;
	}

	const block = item.block as BlockData;
	const windowWidth = window.innerWidth;
	let blockWidth = windowWidth < 700 ? (windowWidth - 120) / 10 : 48;
	blockWidth = blockWidth - block.indent * 4;
	blockWidth = Math.round(blockWidth * 10) / 10;

	return (
		<div
			className={classes.root}
			style={{
				...getItemStyles(currentOffset),
				width: `${blockWidth - 0.1}rem`
			}}
		>
			{block.showTitle && (
				<div
					className={classes.title}
					style={{backgroundColor: block.color}}
				>
					<pre>{block.title}</pre>
				</div>
			)}
			{block.showBody && (
				<div
					className={classes.body}
					style={{backgroundColor: block.showTitle ? `${block.color}66` : block.color}}
				>
					<pre>{block.body}</pre>
				</div>
			)}
		</div>
	);
});

export default DragLayer<Props, CollectedProps>(collect)(BlockPreview);
