import * as React from 'react';
import {findDOMNode} from 'react-dom';
import cls from 'classnames';
import {WithStyles, createStyles, withStyles} from '@material-ui/core';
import TextareaAutosize from 'react-autosize-textarea';
import {
	DragSource,
	DropTarget,
	ConnectDragSource,
	ConnectDropTarget,
	DropTargetMonitor,
	ConnectDragPreview
} from 'react-dnd';
import hex2rgba from 'hex-to-rgba';
import isMobile from '@/lib/is-mobile';
import {isEqual} from 'lodash';

const styles = createStyles({
	focus: {},
	dragging: {},
	root: {
		position: 'relative',
		margin: '0.3rem 0',
		display: 'flex',
		flexDirection: 'column',
		'&:first-child': {
			paddingTop: '2rem',
			marginTop: '-2.7rem'
		},
		'&:last-child': {
			paddingBottom: '2rem',
			marginBottom: '-2.7rem'
		}
	},
	outerContent: {
		position: 'relative',
		flex: '1 1 auto',
		display: 'flex'
	},
	content: {
		position: 'relative',
		flex: '1 1 auto',
		display: 'flex',
		flexDirection: 'column',
		boxShadow: '0 1px 0.1rem 0 rgba(0,0,0,0.2)',
		borderRadius: '0.4rem',
		overflow: 'hidden',
		cursor: 'pointer',
		'$focus &': {
			boxShadow: '0 0 0.4rem 0.3rem rgba(2, 91, 167, 0.43)'
		},
		'$root:not($focus):not($dragging) &:hover': {
			opacity: 0.8
		},
		'$dragging &': {
			backgroundColor: 'rgba(0, 0, 0, 0.05)',
			cursor: 'grabbing'
		}
	},
	title: {
		display: 'flex',
		textAlign: 'left',
		paddingRight: '2rem',
		'& pre': {
			fontFamily: `'Roboto Mono', 'Courier New', Courier, monospace`,
			fontSize: '11px',
			resize: 'none',
			flex: '1 1 auto',
			border: 'none',
			padding: '0.6rem',
			backgroundColor: 'transparent',
			fontWeight: 500
		},
		'$dragging &': {
			opacity: 0
		}
	},
	text: {
		display: 'flex',
		textAlign: 'left',
		paddingRight: '2rem',
		'$focus &': {
			cursor: 'text'
		},
		'& pre': {
			fontFamily: `'Roboto Mono', 'Courier New', Courier, monospace`,
			fontSize: '11px',
			resize: 'none',
			flex: '1 1 auto',
			border: 'none',
			padding: '0.6rem',
			backgroundColor: 'transparent'
		},
		'$dragging &': {
			opacity: 0
		}
	},
	textarea: {
		fontFamily: `'Roboto Mono', 'Courier New', Courier, monospace`,
		fontSize: '11px',
		resize: 'none',
		flex: '1 1 auto',
		border: 'none',
		padding: '0.6rem',
		backgroundColor: 'transparent',
		'$title > &': {
			fontWeight: 500
		},
		'pre&': {
			margin: 0,
			whiteSpace: 'pre-wrap',
			minHeight: '1.5rem'
		},
		'$focus pre&': {
			display: 'none'
		}
	},
	dialogTitle: {
		fontSize: '1.6rem',
		fontWeight: 600,
		color: 'rgba(0,0,0,0.87)'
	},
	dialogText: {
		fontSize: '1.6rem',
		fontWeight: 500,
		fontFamily: 'Montserrat, Arial, sans-serif'
	},
	dialogButton: {
		fontSize: '1.3rem',
		fontWeight: 600,
		color: '#2196f3'
	}
});

export interface BlockPosition {
	row: number;
	column: number;
	index: number;
}

export interface BlockData {
	id: any;
	title: string;
	body: string;
	showTitle: boolean;
	showBody: boolean;
	color: string;
	indent: number;
}

interface OwnProps {
	fullScreen?: boolean;
	block: BlockData;
	focused: boolean;
	position: BlockPosition;
	onMoveBlock: (dragBlock: BlockData, dragPosition: BlockPosition, hoverPosition: BlockPosition) => any;
	onChange: (position: BlockPosition, prop: keyof BlockData, value: any) => any;
	onClick: (position: BlockPosition) => any;
}

interface BlockSourceCollectedProps {
	isDragging: boolean;
	connectDragSource: ConnectDragSource;
	connectDragPreview: ConnectDragPreview;
}

interface BlockTargetCollectedProps {
	connectDropTarget: ConnectDropTarget;
}

const cardSource = {
	beginDrag({block, position}: OwnProps) {
		return {
			id: block.id,
			position,
			block
		};
	}
};

const cardTarget = {
	hover(props: OwnProps, monitor: DropTargetMonitor, component: Block | null) {
		if (!component) {
			return null;
		}

		const dragPos = monitor.getItem().position;
		const hoverPos = {...props.position};

		// Determine rectangle on screen
		const hoverBoundingRect = (findDOMNode(component) as Element).getBoundingClientRect();

		// Get vertical middle
		const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

		// Determine mouse position
		const clientOffset = monitor.getClientOffset() ?? {x: 0, y: 0};

		// Get pixels to the top
		const hoverClientY = clientOffset.y - hoverBoundingRect.top;

		// Only perform the move when the mouse has crossed half of the items height
		// When dragging downwards, only move when the cursor is below 50%
		// When dragging upwards, only move when the cursor is above 50%

		if (dragPos.row === hoverPos.row && dragPos.column === hoverPos.column) {
			// Hovering itself
			if (dragPos.index === hoverPos.index) {
				return null;
			}

			// Dragging downwards
			if (dragPos.index < hoverPos.index && hoverClientY < hoverMiddleY) {
				return null;
			}

			// Dragging upwards
			if (dragPos.index > hoverPos.index && hoverClientY > hoverMiddleY) {
				return null;
			}
		} else if (dragPos.row > hoverPos.row && props.block.id && hoverClientY > hoverMiddleY) {
			hoverPos.index++;
		}

		let dragBlock: BlockData = monitor.getItem().block;

		if (!dragBlock.id) {
			dragBlock = {...dragBlock, id: new Date().getTime()};
			monitor.getItem().id = dragBlock.id;
			monitor.getItem().block = dragBlock;
		}

		// Time to actually perform the action
		props.onMoveBlock(dragBlock, dragPos, hoverPos);

		// Note: we're mutating the monitor item here!
		// Generally it's better to avoid mutations,
		// but it's good here for the sake of performance
		// to avoid expensive index searches.
		monitor.getItem().position = hoverPos;
		return null;
	}
};

type Props = OwnProps & WithStyles<typeof styles> & BlockSourceCollectedProps & BlockTargetCollectedProps;

interface State {
	wWidth: number;
	wHeight: number;
	showDeleteDialog: boolean;
}

class Block extends React.PureComponent<Props, State> {
	public state: State = {wWidth: 0, wHeight: 0, showDeleteDialog: false};

	public titleRef = React.createRef<any>();
	public bodyRef = React.createRef<any>();

	public componentDidMount() {
		window.addEventListener('resize', this.updateDimensions);
		this.updateDimensions();
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this.updateDimensions);
	}

	public updateDimensions = () => {
		this.setState({wWidth: window.innerWidth, wHeight: window.innerHeight});
	}

	public focusBlock = () => {
		const {block} = this.props;
		if (block.showTitle) {
			const textarea = this.titleRef.current;
			if (textarea) {
				textarea.focus();
			}
		} else {
			const textarea = this.bodyRef.current;
			if (textarea) {
				textarea.focus();
			}
		}
	}

	public handleToggleDeleteDialog = (show: boolean) => () => {
		this.setState({showDeleteDialog: show})
	}

	public preventClickPropagation = (evt: React.MouseEvent) => {
		evt.stopPropagation();
	}

	public handleClick = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.props.onClick(this.props.position);
	}

	public getInputHandler = (prop: 'title' | 'body') => (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
		const {onChange, position} = this.props;
		onChange(position, prop, evt.target.value);
	}

	public render() {
		const {
			block,
			focused,
			classes,
			connectDragSource,
			connectDropTarget,
			connectDragPreview,
			isDragging
		} = this.props;

		let contentElem = (
			<div className={classes.content} onClick={this.handleClick}>
				{block.showTitle && (
					<div
						className={classes.title}
						style={{backgroundColor: block.color}}
					>
						{focused && (
							<TextareaAutosize
								className={classes.textarea}
								ref={this.titleRef}
								value={block.title}
								onChange={this.getInputHandler('title')}
								spellCheck={false}
								autoFocus
							/>
						)}
						<pre className={classes.textarea}>
							{block.title}
						</pre>
					</div>
				)}
				{block.showBody && (
					<div
						className={classes.text}
						style={{backgroundColor: hex2rgba(`${block.color}66`)}}
					>
						{focused && (
							<TextareaAutosize
								className={classes.textarea}
								ref={this.bodyRef}
								value={block.body}
								onChange={this.getInputHandler('body')}
								spellCheck={false}
								autoFocus={!block.showTitle}
							/>
						)}
						<pre className={classes.textarea}>
							{block.body}
						</pre>
					</div>
				)}
			</div>
		);

		if (!focused && !isMobile.any()) {
			contentElem = connectDragSource(contentElem)!;
		}

		let elem = (
			<div
				key={block.id}
				className={cls(classes.root, {[classes.focus]: focused, [classes.dragging]: isDragging})}
				style={{paddingLeft: `${block.indent * 4}rem`}}
			>
				<div className={classes.outerContent}>
					{contentElem}
				</div>
				{/* <Dialog
					fullScreen={fullScreen}
					open={this.state.showDeleteDialog}
					onClose={this.handleToggleDeleteDialog(false)}
					fullWidth
				>
					<DialogTitle disableTypography className={classes.dialogTitle}>{'Confirm delete'}</DialogTitle>
					<DialogContent>
						<DialogContentText className={classes.dialogText}>
							This action cannot be reversed. Area you sure you want to delete this block?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={this.handleToggleDeleteDialog(false)} color="primary" className={classes.dialogButton}>
							Cancel
						</Button>
						<Button
							onClick={this.handleDelete}
							color="primary"
							className={classes.dialogButton}
						>
							Delete
						</Button>
					</DialogActions>
				</Dialog> */}
			</div>
		);

		elem = connectDropTarget(elem)!;
		elem = connectDragPreview(elem)!;

		return elem;
	}
}

const StyledBlock = withStyles(styles)(Block);

const dropTarget = DropTarget<OwnProps, BlockTargetCollectedProps>(
	'block',
	cardTarget,
	connect => ({
		connectDropTarget: connect.dropTarget()
	})
);

const dragSource = DragSource<OwnProps, BlockSourceCollectedProps>(
	'block',
	cardSource,
	(connect, monitor, props) => ({
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: props.block.id === monitor.getItem()?.id
	}),
	{arePropsEqual: (first, second) => isEqual(first.block, second.block)}
);

export default dropTarget(dragSource(StyledBlock));
