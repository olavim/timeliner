import * as React from 'react';
import {createStyles, WithStyles, withStyles} from '@material-ui/core';
import {SketchPicker as _SketchPicker} from 'react-color';

const styles = createStyles({
	focus: {},
	wrapper: {
		minHeight: '8rem',
		height: '100%',
		maxWidth: '50rem',
		display: 'flex',
		flexDirection: 'column',
		transition: 'padding 0.2s, margin 0.2s',
		borderRight: '1px dotted rgba(0,0,0,0.1)',
		flex: '0 0 50rem',
		minWidth: '50rem',
		padding: '1.2rem 0',
		boxSizing: 'border-box'
	},
	root: {
		flex: 1,
		width: '100%',
		position: 'relative',
		padding: '0.7rem 1rem',
		display: 'flex',
		flexDirection: 'column',
		boxSizing: 'border-box'
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

interface Props extends WithStyles<typeof styles> {
	className: string;
}

class BlockList extends React.Component<Props> {
	// public getPresetColors = () => {
	// 	const set = new Set(this.props.blocks.map(b => b.color));
	// 	return Array.from(set);
	// }

	// public handleOpenColorPicker = (evt: React.MouseEvent) => {
	// 	evt.stopPropagation();
	// 	this.setState({showColorPicker: true});
	// }

	// public handleCloseColorPicker = (evt: React.MouseEvent) => {
	// 	evt.stopPropagation();
	// 	this.setState({showColorPicker: false});
	// }

	public render() {
		const {classes, children, className} = this.props;

		return (
			<div className={`${classes.wrapper} ${className}`}>
				<div className={classes.root}>
					{children}
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
