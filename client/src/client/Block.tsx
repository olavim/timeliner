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
import {XYCoord} from 'dnd-core';
import hex2rgba from 'hex-to-rgba';
import {BlockData} from './BlockList';
import isMobile from '@/lib/is-mobile';

const styles = createStyles({
	focus: {},
	root: {
		position: 'relative',
		margin: '0.3rem 0',
		display: 'flex',
		flexDirection: 'column',
		cursor: 'pointer',
		'& button': {
			display: 'flex',
			alignItems: 'center',
			border: 'none',
			backgroundColor: 'transparent',
			fontSize: '1.1rem',
			fontWeight: 500
		},
		'& button:not(:disabled)': {
			cursor: 'pointer'
		},
		'& button:not(:disabled):hover': {
			opacity: 0.6
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
		border: '1px solid rgba(0,0,0,0.2)',
		boxShadow: '0 0 0.3rem 0 rgba(0,0,0,0.13)',
		borderRadius: '0.4rem',
		overflow: 'hidden',
		'$focus &': {
			boxShadow: '0 0 2rem 0 rgba(0,67,255,0.43)'
		},
		'$root:not($focus) &:hover': {
			opacity: 0.8
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
			whiteSpace: 'pre-wrap'
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

interface OwnProps {
	fullScreen?: boolean;
	block: BlockData;
	index: number;
	moveBlock: (hoverIndex: number, dragIndex: number) => any;
	onChange: (id: any, prop: keyof BlockData, value: any) => any;
	onClick: (idx: number) => any;
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
	beginDrag({block, index}: OwnProps) {
		return {
			id: block.id,
			index,
			block
		};
	}
};

const cardTarget = {
	hover(props: OwnProps, monitor: DropTargetMonitor, component: Block | null) {
		if (!component) {
			return null;
		}
		const dragIndex = monitor.getItem().index;
		const hoverIndex = props.index;

		// Don't replace items with themselves
		if (dragIndex === hoverIndex) {
			return null;
		}

		// Determine rectangle on screen
		const hoverBoundingRect = (findDOMNode(component) as Element).getBoundingClientRect();

		// Get vertical middle
		const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

		// Determine mouse position
		const clientOffset = monitor.getClientOffset();

		// Get pixels to the top
		const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

		// Only perform the move when the mouse has crossed half of the items height
		// When dragging downwards, only move when the cursor is below 50%
		// When dragging upwards, only move when the cursor is above 50%

		// Dragging downwards
		if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
			return null;
		}

		// Dragging upwards
		if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
			return null;
		}

		// Time to actually perform the action
		props.moveBlock(dragIndex, hoverIndex);

		// Note: we're mutating the monitor item here!
		// Generally it's better to avoid mutations,
		// but it's good here for the sake of performance
		// to avoid expensive index searches.
		monitor.getItem().index = hoverIndex;
		return null;
	}
};

type Props = OwnProps & WithStyles<typeof styles> & BlockSourceCollectedProps & BlockTargetCollectedProps;

interface State {
	prepareClick: boolean;
	wWidth: number;
	wHeight: number;
	showDeleteDialog: boolean;
}

class Block extends React.PureComponent<Props, State> {
	public state: State = {prepareClick: false, wWidth: 0, wHeight: 0, showDeleteDialog: false};

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

	public componentDidUpdate(prevProps: Props) {
		if (!prevProps.isDragging && this.props.isDragging) {
			this.setState({prepareClick: false});
		}
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

	public handleMoveUp = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.props.moveBlock(this.props.index - 1, this.props.index);
	}

	public handleMoveDown = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.props.moveBlock(this.props.index + 1, this.props.index);
	}

	public handleToggleDeleteDialog = (show: boolean) => () => {
		this.setState({showDeleteDialog: show})
	}

	public preventClickPropagation = (evt: React.MouseEvent) => {
		evt.stopPropagation();
	}

	public handleMouseDown = () => {
		this.setState({prepareClick: true});
	}

	public handleClick = (evt: React.MouseEvent) => {
		evt.stopPropagation();

		if (this.state.prepareClick) {
			this.props.onClick(this.props.index);
		}
	}

	public getInputHandler = (prop: 'title' | 'body') => (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
		const {onChange, block} = this.props;
		onChange(block.id, prop, evt.target.value);
	}

	public render() {
		const {
			block,
			classes,
			connectDragSource,
			connectDropTarget,
			connectDragPreview,
			isDragging,
			index
		} = this.props;

		const tabIndex = index * 2 + 1;

		let contentElem = (
			<div className={classes.content}>
				{block.showTitle && (
					<div
						className={classes.title}
						style={{backgroundColor: block.color}}
					>
						{block.focused && (
							<TextareaAutosize
								className={classes.textarea}
								tabIndex={tabIndex}
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
						{block.focused && (
							<TextareaAutosize
								className={classes.textarea}
								tabIndex={tabIndex + (block.showTitle ? 1 : 0)}
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

		if (!block.focused && !isMobile.any()) {
			contentElem = connectDragSource(contentElem);
		}

		let elem = (
			<div
				key={block.id}
				className={cls(classes.root, {[classes.focus]: block.focused})}
				style={{
					paddingLeft: `${block.indent * 4}rem`,
					opacity: isDragging ? 0 : 1,
					cursor: isDragging ? 'grabbing' : 'pointer'
				}}
				onMouseDown={this.handleMouseDown}
				onClick={this.handleClick}
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

		elem = connectDropTarget(elem);
		elem = connectDragPreview(elem);

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
	(connect, monitor) => ({
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: monitor.isDragging()
	})
);

export default dropTarget(dragSource(StyledBlock));
