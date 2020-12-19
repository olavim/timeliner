import * as React from 'react';
import {createStyles, WithStyles, withStyles} from '@material-ui/core';
import * as _memoize from 'memoizee';
import Block from './Block';
import {SketchPicker as _SketchPicker} from 'react-color';

const memoize = (_memoize as any).default;

const styles = createStyles({
	focus: {},
	wrapper: {
		minHeight: '100%',
		maxWidth: '50rem',
		width: 'calc(100% - 6rem)',
		display: 'flex',
		flexDirection: 'column',
		transition: 'padding 0.2s, margin 0.2s',
		'@media (min-width: 960px)': {
			borderLeft: '1px dotted rgba(0,0,0,0.1)',
			borderRight: '1px dotted rgba(0,0,0,0.1)',
			width: '50rem',
			minWidth: '50rem'
		},
		'&$focus': {
			'@media (max-width: 960px)': {
				paddingTop: '5rem'
			},
			'@media (max-height: 500px) and (orientation:landscape)': {
				paddingTop: 'inherit',
				width: 'calc(100% - 12rem)'
			}
		}
	},
	root: {
		width: '100%',
		position: 'relative',
		padding: '0.4rem 1rem 60vh 1rem',
		display: 'flex',
		flexDirection: 'column',
		boxSizing: 'border-box'
	},
	listActions: {
		marginTop: '0.6rem',
		textAlign: 'right'
	},
	checkboxRoot: {
		margin: '0.5rem',
	},
	checkbox: {
		border: '2px solid #00ccff'
	},
	colorChooser: {
		position: 'absolute',
		top: '0',
		left: '0',
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 2000
	},
	colorChooserComponent: {
		zIndex: 5
	},
	colorChooserContent: {
		display: 'flex',
		flexDirection: 'row',
		maxWidth: '60rem',
		width: '60rem',
		padding: '2rem',
		borderRadius: '0.5rem',
		overflow: 'hidden',
		boxShadow: '0 0 20rem 0 #000000',
		position: 'relative',
		'@media (max-width: 760px)': {
			width: 'auto',
			height: '32rem',
			flexDirection: 'column-reverse'
		}
	},
	colorPreview: {
		display: 'flex',
		flexDirection: 'column',
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		backgroundColor: '#fafafa',
		borderRadius: '1rem',
		'& > div:first-child': {
			flex: 0.5,
			width: '100%'
		},
		'& > div:last-child': {
			flex: '1 1 auto',
			width: '100%'
		}
	}
});

export interface BlockData {
	id: any;
	title: string;
	body: string;
	showTitle: boolean;
	showBody: boolean;
	color: string;
	indent: number;
	focused: boolean;
}

interface Props extends WithStyles<typeof styles> {
	fullScreen?: boolean;
	blocks: BlockData[];
	onChange: (blocks: BlockData[]) => any;
	onClickBlock: (idx: number) => any;
}

class BlockList extends React.Component<Props> {
	public getBlock = memoize(
		(block: BlockData, index: number, fullScreen?: boolean) => (
			<Block
				key={block.id}
				index={index}
				fullScreen={fullScreen}
				onChange={this.handleChangeBlock}
				onClick={this.props.onClickBlock}
				block={block}
				moveBlock={this.handleMoveBlock}
			/>
		),
		{normalizer: (args: any) => args[2] ? Date.now() : JSON.stringify(args)}
	);

	public handleChangeBlock = (id: any, prop: keyof BlockData, value: any) => {
		const blocks = this.props.blocks.slice();
		const index = blocks.findIndex(b => b.id === id);
		if (index !== -1) {
			const newBlock = Object.assign({}, blocks[index], {[prop]: value});
			blocks[index] = newBlock;
			this.props.onChange(blocks);
		}
	}

	public getPresetColors = () => {
		const set = new Set(this.props.blocks.map(b => b.color));
		return Array.from(set);
	}

	public handleOpenColorPicker = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.setState({showColorPicker: true});
	}

	public handleCloseColorPicker = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.setState({showColorPicker: false});
	}

	public handleMoveBlock = (dragIndex: any, hoverIndex: any) => {
		const {blocks, onChange} = this.props;
		if (dragIndex >= 0 && hoverIndex >= 0 && dragIndex < blocks.length && hoverIndex < blocks.length) {
			const newBlocks = blocks.slice();
			const dragBlock = newBlocks[dragIndex];
			newBlocks.splice(dragIndex, 1);
			newBlocks.splice(hoverIndex, 0, dragBlock);
			onChange(newBlocks);
		}
	}

	public render() {
		const {classes, blocks, fullScreen} = this.props;

		return (
			<div className={classes.wrapper}>
				<div className={classes.root}>
					{blocks.map((block, index) =>
						this.getBlock(block, index, fullScreen)
					)}
				</div>
				{/* {focusedBlock && (
					<div
						className={classes.colorChooser}
						style={{display: this.state.showColorPicker ? 'flex' : 'none'}}
						onClick={this.handleCloseColorPicker}
					>
						<div className={classes.colorChooserContent} onClick={this.handleOpenColorPicker}>
							<SketchPicker
								disableAlpha
								color={focusedBlock.color}
								onChange={this.handleChangeBlockColor}
								presetColors={this.getPresetColors()}
								className={classes.colorChooserComponent}
							/>
							<div className={classes.colorPreview}>
								<div style={{backgroundColor: focusedBlock.color}} />
								<div style={{backgroundColor: `${focusedBlock.color}66`}} />
							</div>
						</div>
					</div>
				)} */}
			</div>
		);
	}
}

export default withStyles(styles)(BlockList);
