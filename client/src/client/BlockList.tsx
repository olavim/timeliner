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
		boxSizing: 'border-box',
		userSelect: 'none'
	},
	root: {
		flex: 1,
		width: '100%',
		position: 'relative',
		padding: '0.7rem 1rem',
		display: 'flex',
		flexDirection: 'column',
		boxSizing: 'border-box'
	}
});

interface Props extends WithStyles<typeof styles> {
	className: string;
}

class BlockList extends React.Component<Props> {
	public render() {
		const {classes, children, className} = this.props;

		return (
			<div className={`${classes.wrapper} ${className}`}>
				<div className={classes.root}>
					{children}
				</div>
			</div>
		);
	}
}

export default withStyles(styles)(BlockList);
