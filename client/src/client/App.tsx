import * as React from 'react';
import {findDOMNode} from 'react-dom';
import axios, {AxiosInstance} from 'axios';
import {cloneDeep, pick, debounce, isEqual} from 'lodash';
import cls from 'classnames';
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
import JSZip from 'jszip';
import * as _memoize from 'memoizee';
import MenuIcon from '@material-ui/icons/Menu';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import FileTreeIcon from '@material-ui/icons/FolderOpen';
import DownloadIcon from '@material-ui/icons/GetApp';
import githubIcon from './github-32px.png';
import BlockList from './BlockList';
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
import Block, {BlockPosition, BlockData} from './Block';
import {DragLayer} from 'react-dnd';
import TextareaAutosize from 'react-autosize-textarea/lib';
import {ColorState, SketchPicker} from 'react-color';

const memoize = (_memoize as any).default;

const styles = createStyles({
	dragging: {},
	focus: {},
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
		flex: '0 0 5rem',
		justifyContent: 'flex-start',
		alignItems: 'center',
		'& button:disabled': {
			opacity: 0.4
		}
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
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		flex: '0 0 auto',
		minWidth: 'min-content',
		'&:last-child': {
			flex: '1 1 auto'
		}
	},
	contentRowPreview: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		minWidth: 'min-content',
		flex: '1 1 auto',
		'& $rowTitle': {
			opacity: 0.5,
			cursor: 'pointer',
			display: 'none',
			height: '4rem'
		},
		'&:hover $rowTitle': {
			display: 'flex'
		},
		'&:hover $rowTitle:hover': {
			opacity: 1
		},
		'&:not(:hover) $blockListWrapper': {
			minHeight: '12rem'
		}
	},
	rowTitle: {
		flex: '0 0 auto',
		width: 'calc(100vw - 25.5rem)',
		backgroundColor: '#fff',
		display: 'flex',
		justifyContent: 'flex-start',
		alignItems: 'center',
		boxSizing: 'border-box',
		boxShadow: '0 0.1rem 0.1rem 0 rgba(0,0,0,0.1)',
		position: 'sticky',
		top: '1.3rem',
		left: '0',
		zIndex: 2,
		'&:hover': {
			boxShadow: '0 0.1rem 0.1rem 0 rgba(0,0,0,0.2)'
		},
		'$contentRow:first-child &': {
			marginTop: '1.3rem'
		},
		'$contentRow$focus &': {
			boxShadow: '0 0.1rem 0.2rem 0 rgba(0,0,0,0.4)'
		},
		'$contentRow:not($focus) &': {
			cursor: 'pointer'
		},
		'& textarea': {
			padding: '1.1rem 2rem',
			boxSizing: 'border-box',
			fontWeight: 400,
			width: '100%',
			height: '4rem',
			border: 'none',
			resize: 'none',
			fontSize: '13px',
			fontFamily: `Montserrat, Arial, sans-serif`
		},
		'& pre': {
			margin: 0,
			whiteSpace: 'pre-wrap',
			padding: '1.1rem 2rem',
			boxSizing: 'border-box',
			fontWeight: 400,
			width: '100%',
			minHeight: '4rem',
			border: 'none',
			fontSize: '13px',
			fontFamily: `Montserrat, Arial, sans-serif`,
			textAlign: 'left'
		}
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
	},
	blockListWrapper: {
		flex: '0 0 auto',
		display: 'flex',
		height: 'calc(100% - 4.2rem)'
	},
	blockList: {
		borderRight: '1px dotted rgba(0,0,0,0.1)',
		'&:first-child': {
			marginLeft: '1.4rem'
		}
	},
	blockListPreview: {
		borderRight: 'none'
	},
	blockPreview: {
		display: 'flex',
		width: '100%',
		flexDirection: 'column',
		opacity: 0,
		'$root:not($dragging) $blockList:hover &': {
			opacity: 0.5
		},
		'$dragging &': {
			opacity: 0
		}
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
		zIndex: 5,
		'& > div:first-child': {
			userSelect: 'none'
		}
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
	showColorPicker: boolean;
	downloadData: {blob: Blob; filename: string} | null;
	focusedBlockPosition: BlockPosition | null;
	focusedRow: number;
}

interface CollectProps {
	isDragging: boolean;
}

type AppProps = CollectProps & WithMobileDialog & WithStyles<typeof styles> & WithAuthProps;

const previewBlock: BlockData = {
	id: null,
	title: ' ',
	body: ' ',
	indent: 0,
	showTitle: true,
	showBody: true,
	color: '#ffcc88'
};

class App extends React.Component<AppProps, State> {
	public contentRef = React.createRef<any>();
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
		showColorPicker: false,
		downloadData: null,
		focusedBlockPosition: null,
		focusedRow: -1
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

	public getBlock = memoize(
		(block: BlockData, pos: BlockPosition, focused: boolean, fullScreen?: boolean) => (
			<Block
				key={`${block.id}:${String(focused)}:${pos.row}:${pos.column}:${pos.index}`}
				block={block}
				position={pos}
				fullScreen={fullScreen}
				focused={focused}
				onChange={this.handleChangeBlock}
				onClick={this.handleClickBlock}
				onMoveBlock={this.handleDragBlock}
			/>
		),
		{normalizer: (args: any) => args[3] ? Date.now() : JSON.stringify(args)}
	);

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

	public handleDocumentClick = (_evt: any) => {
		this.setState({focusedBlockPosition: null, focusedRow: -1});
	}

	public componentDidUpdate(_prevProps: any, prevState: State) {
		if (!prevState.fontsLoaded && this.state.fontsLoaded) {
			setTimeout(() => {
				window.requestAnimationFrame(() => {
					const elem = findDOMNode(this.contentRef.current) as HTMLElement;
					if (elem) {
						elem.scrollTo(0, 0);
					}
				});
			}, 0);
		}
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
		this.setDownloadData(`${timeline!.name || 'timeline'}.cbt`, JSON.stringify(timeline!.data));
	}

	public handleExportOutlines = () => {
		const rows = this.state.timeline!.data;
		const outlines: BlockData[][] = [];

		for (let i = 0; i < rows.length; i++) {
			for (let j = 0; j < rows[i].columns.length; j++) {
				if (!outlines[j]) {
					outlines[j] = [];
				}

				outlines[j].push({
					id: i,
					title: rows[i].title || `#${i + 1}`,
					body: '',
					color: '#ffffff',
					indent: 0,
					showTitle: true,
					showBody: false
				});

				outlines[j].push(...rows[i].columns[j]);
			}
		}

		const zip = new JSZip();
		for (let i = 0; i < outlines.length; i++) {
			const filename = `column${String(i).padStart(3, '0')}.cbo`;
			zip.file(filename, JSON.stringify(outlines[i]));
		}

		zip.generateAsync({type: 'blob'}).then(content => {
			this.setDownloadData('outlines.zip', content);
		});
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
		if (this.props.auth.isAuthenticated) {
			const {data} = await this.api.patch(`/timelines/${timeline!.id}`, pick(timeline, ['name', 'data']));

			localStorage.setItem('timeliner-data', JSON.stringify(data.timeline));

			if (!timeline!.id) {
				this.setState({timeline: data.timeline});
			}
		} else {
			localStorage.setItem('timeliner-data', JSON.stringify(timeline));
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
			const timeline = {data: [{title: '', columns: [[]]}]};
			return this.setState({timeline, showConfirmDialog: false, showDrawer: false}, this.handleSave);
		}

		const timeline = this.state.timeline;
		await this.api.delete(`/timelines/${timeline!.id}`);

		this.setState({showConfirmDialog: false}, () => this.handleList());
	}

	public handleLogout = () => {
		localStorage.setItem('timeliner-data', JSON.stringify({data: []}));
		this.props.auth.logout({returnTo: window.location.origin});
	}

	public getPresetColors = () => {
		const set = new Set<string>();

		for (const rowData of this.state.timeline?.data || []) {
			for (const blocks of rowData.columns) {
				for (const block of blocks) {
					set.add(block.color);
				}
			}
		}

		return Array.from(set);
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

	public getBlockChangeHandler = (row: number, col: number) => (data: BlockData[]) => {
		let timeline = cloneDeep(this.state.timeline);
		timeline!.data[row].columns[col] = data;

		if (this.props.auth.isAuthenticated) {
			this.handleSave();
		} else {
			localStorage.setItem('timeliner-data', JSON.stringify(timeline));
		}

		this.setState({timeline});
	}

	public handleOpenColorPicker = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.setState({showColorPicker: true});
	}

	public handleCloseColorPicker = (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.setState({showColorPicker: false});
	}

	public handleChangeBlock = (pos: BlockPosition, prop: keyof BlockData, value: any) => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			Object.assign(timeline.data[pos.row].columns[pos.column][pos.index], {[prop]: value});
			return {timeline};
		}, this.handleSave);
	}

	public handleClickBlock = (pos: BlockPosition) => {
		this.setState({focusedRow: -1, focusedBlockPosition: pos});
	}

	public getRowClickHandler = (row: number) => (evt: React.MouseEvent) => {
		evt.stopPropagation();
		this.setState({focusedRow: row, focusedBlockPosition: null});
	}

	public getRowChangeHandler = (row: number) => (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
		evt.stopPropagation();
		const value = evt.target.value;

		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			timeline.data[row].title = value;
			return {timeline};
		}, this.handleSave);
	}

	public handleDragBlock = (dragBlock: BlockData, dragPos: BlockPosition, hoverPos: BlockPosition) => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;

			if (hoverPos.column === timeline.data[hoverPos.row].columns.length) {
				for (const rowData of timeline.data) {
					rowData.columns.push([]);
				}
			}

			if (timeline.data[dragPos.row]?.columns[dragPos.column]?.[dragPos.index]) {
				timeline.data[dragPos.row].columns[dragPos.column].splice(dragPos.index, 1);
			}

			timeline.data[hoverPos.row].columns[hoverPos.column].splice(hoverPos.index, 0, dragBlock);

			while (true) {
				const isLastColumnEmpty = timeline.data.every(
					rowData => rowData.columns[rowData.columns.length - 1].length === 0
				);

				if (!isLastColumnEmpty) {
					break;
				}

				for (const rowData of timeline.data) {
					rowData.columns.splice(rowData.columns.length - 1, 1);
				}
			}

			return {timeline};
		}, this.handleSave);
	}

	public handleAddPreviewBlock = (pos: BlockPosition) => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;

			if (timeline.data[pos.row].columns.length === pos.column) {
				for (const rowData of timeline.data) {
					rowData.columns.push([]);
				}
			}

			timeline.data[pos.row].columns[pos.column].push({
				...previewBlock,
				id: new Date().getTime(),
				title: '',
				body: ''
			});

			return {timeline, focusedBlockPosition: pos};
		}, this.handleSave);
	}

	public handleAddPreviewRow = (evt: React.MouseEvent) => {
		evt.stopPropagation();

		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;

			const columns = [];
			for (let i = 0; i < timeline.data[0]?.columns.length ?? 0; i++) {
				columns.push([]);
			}

			timeline.data.push({title: '', columns});

			return {timeline, focusedBlockPosition: null, focusedRow: timeline.data.length - 1};
		}, this.handleSave);
	}

	public handleAddBlockAbove = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column].splice(pos.index, 0, {
				...timeline.data[pos.row].columns[pos.column][pos.index],
				id: new Date().getTime(),
				body: '',
				title: ''
			});

			return {timeline, focusedBlockPosition: {...pos, index: pos.index - 1}};
		}, this.handleSave);
	};

	public handleAddBlockBelow = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column].splice(pos.index + 1, 0, {
				...timeline.data[pos.row].columns[pos.column][pos.index],
				id: new Date().getTime(),
				body: '',
				title: ''
			});

			return {timeline, focusedBlockPosition: {...pos, index: pos.index + 1}};
		}, this.handleSave);
	};

	public handleMoveBlockUp = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;
			const newPos = {...pos};

			const focusedBlock = timeline.data[pos.row].columns[pos.column][pos.index];

			if (pos.index > 0) {
				newPos.index = pos.index - 1;
			} else if (pos.row > 0) {
				newPos.row = pos.row - 1;
				newPos.index = timeline.data[newPos.row].columns[newPos.column].length;
			}

			timeline.data[pos.row].columns[pos.column].splice(pos.index, 1);
			timeline.data[newPos.row].columns[newPos.column].splice(newPos.index, 0, focusedBlock);

			return {timeline, focusedBlockPosition: newPos};
		}, this.handleSave);
	};

	public handleMoveBlockDown = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;
			const newPos = {...pos};

			const focusedBlock = timeline.data[pos.row].columns[pos.column][pos.index];

			if (pos.index < timeline.data[pos.row].columns[pos.column].length - 1) {
				newPos.index = pos.index + 1;
			} else if (pos.row < timeline.data.length - 1) {
				newPos.row = pos.row + 1;
				newPos.index = 0;
			}

			timeline.data[pos.row].columns[pos.column].splice(pos.index, 1);
			timeline.data[newPos.row].columns[newPos.column].splice(newPos.index, 0, focusedBlock);

			return {timeline, focusedBlockPosition: newPos};
		}, this.handleSave);
	};

	public handleRemoveBlock = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column].splice(pos.index, 1);
			return {timeline};
		}, this.handleSave);
	};

	public handleIndentBlock = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			const indentation = timeline.data[pos.row].columns[pos.column][pos.index].indent;
			timeline.data[pos.row].columns[pos.column][pos.index].indent = Math.min(10, indentation + 1);

			return {timeline};
		}, this.handleSave);
	};

	public handleOutdentBlock = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			const indentation = timeline.data[pos.row].columns[pos.column][pos.index].indent;
			timeline.data[pos.row].columns[pos.column][pos.index].indent = Math.max(0, indentation - 1);

			return {timeline};
		}, this.handleSave);
	};

	public handleAddRowAbove = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			const columns = [];
			for (let i = 0; i < timeline.data[0]?.columns.length ?? 0; i++) {
				columns.push([]);
			}

			timeline.data.splice(pos.row, 0, {title: '', columns});
			return {timeline, focusedBlockPosition: null, focusedRow: pos.row};
		}, this.handleSave);
	};

	public handleAddRowBelow = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			const columns = [];
			for (let i = 0; i < timeline.data[0]?.columns.length ?? 0; i++) {
				columns.push([]);
			}

			timeline.data.splice(pos.row + 1, 0, {title: '', columns});
			return {timeline, focusedBlockPosition: null, focusedRow: pos.row + 1};
		}, this.handleSave);
	};

	public handleAddColumnLeft = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			for (const rowData of timeline.data) {
				rowData.columns.splice(pos.column, 0, []);
			}

			return {timeline};
		}, this.handleSave);
	};

	public handleAddColumnRight = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			for (const rowData of timeline.data) {
				rowData.columns.splice(pos.column + 1, 0, []);
			}

			return {timeline};
		}, this.handleSave);
	};

	public handleChangeBlockColor = (colorState: ColorState) => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column][pos.index].color = colorState.hex;
			return {timeline};
		}, this.handleSave);
	}

	public handleShowBlockTitle = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column][pos.index].showTitle = true;
			return {timeline};
		}, this.handleSave);
	}

	public handleShowBlockBody = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column][pos.index].showBody = true;
			return {timeline};
		}, this.handleSave);
	}

	public handleHideBlockTitle = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column][pos.index].showTitle = false;
			return {timeline};
		}, this.handleSave);
	}

	public handleHideBlockBody = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = state.focusedBlockPosition!;

			timeline.data[pos.row].columns[pos.column][pos.index].showBody = false;
			return {timeline};
		}, this.handleSave);
	}

	public handleMoveColumnLeft = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			if (pos.column > 0) {
				for (const rowData of timeline.data) {
					const col = rowData.columns[pos.column];
					rowData.columns.splice(pos.column, 1);
					rowData.columns.splice(pos.column - 1, 0, col);
				}

				pos.column--;
			}

			return {timeline, focusedBlockPosition: pos};
		}, this.handleSave);
	}

	public handleMoveColumnRight = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			if (pos.column < timeline.data[pos.row].columns.length - 1) {
				for (const rowData of timeline.data) {
					const columnData = rowData.columns[pos.column];
					rowData.columns.splice(pos.column, 1);
					rowData.columns.splice(pos.column + 1, 0, columnData);
				}

				pos.column++;
			}

			return {timeline, focusedBlockPosition: pos};
		}, this.handleSave);
	}

	public handleMoveRowUp = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			if (pos.row > 0) {
				const rowData = timeline.data[pos.row];
				timeline.data.splice(pos.row, 1);
				timeline.data.splice(pos.row - 1, 0, rowData);

				pos.row--;
			}

			return {timeline, focusedBlockPosition: pos};
		}, this.handleSave);
	}

	public handleMoveRowDown = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			if (pos.row < timeline.data.length - 1) {
				const rowData = timeline.data[pos.row];
				timeline.data.splice(pos.row, 1);
				timeline.data.splice(pos.row + 1, 0, rowData);

				pos.row++;
			}

			return {timeline, focusedBlockPosition: pos};
		}, this.handleSave);
	}

	public handleDeleteColumn = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			for (const rowData of timeline.data) {
				rowData.columns.splice(pos.column, 1);
			}

			return {timeline, focusedBlockPosition: null};
		}, this.handleSave);
	}

	public handleDeleteRow = () => {
		this.setState(state => {
			const timeline = cloneDeep(state.timeline)!;
			const pos = {...state.focusedBlockPosition!};

			timeline.data.splice(pos.row, 1);

			return {timeline, focusedBlockPosition: null};
		}, this.handleSave);
	}

	public render() {
		const {classes, fullScreen, auth, isDragging} = this.props;
		const {
			timeline,
			showDrawer,
			showFileTree,
			showColorPicker,
			fontsLoaded,
			loading,
			exporting,
			availableTimelines,
			showNewDialog,
			nameStr,
			downloadData,
			focusedBlockPosition: focusedBlockPos,
			focusedRow,
		} = this.state;

		if (!fontsLoaded || loading || auth.loading) {
			return (
				<div className={classes.progressOverlay}>
					<CircularProgress disableShrink/>
				</div>
			);
		}

		const focusedBlock =
			focusedBlockPos &&
			timeline?.data[focusedBlockPos.row].columns[focusedBlockPos.column][focusedBlockPos.index];

		const actions = [
			{icon: MoveBlockUpIcon, onClick: this.handleMoveBlockUp},
			{icon: MoveBlockDownIcon, onClick: this.handleMoveBlockDown},
			{icon: AddBlockAboveIcon, onClick: this.handleAddBlockAbove},
			{icon: AddBlockBelowIcon, onClick: this.handleAddBlockBelow},
			{icon: RemoveBlockIcon, onClick: this.handleRemoveBlock},
			{icon: IndentIcon, onClick: this.handleIndentBlock},
			{icon: OutdentIcon, onClick: this.handleOutdentBlock},
			{icon: AddTitleIcon, onClick: this.handleShowBlockTitle, disabled: focusedBlock?.showTitle},
			{icon: RemoveTitleIcon, onClick: this.handleHideBlockTitle, disabled: !focusedBlock?.showTitle || !focusedBlock?.showBody},
			{icon: AddBodyIcon, onClick: this.handleShowBlockBody, disabled: focusedBlock?.showBody},
			{icon: RemoveBodyIcon, onClick: this.handleHideBlockBody, disabled: !focusedBlock?.showTitle || !focusedBlock?.showBody},
			{icon: ColorChooserIcon, onClick: this.handleOpenColorPicker},
			{icon: MoveColumnLeftIcon, onClick: this.handleMoveColumnLeft},
			{icon: MoveColumnRightIcon, onClick: this.handleMoveColumnRight},
			{icon: MoveRowUpIcon, onClick: this.handleMoveRowUp},
			{icon: MoveRowDownIcon, onClick: this.handleMoveRowDown},
			{icon: AddColumnLeftIcon, onClick: this.handleAddColumnLeft},
			{icon: AddColumnRightIcon, onClick: this.handleAddColumnRight},
			{icon: AddRowAboveIcon, onClick: this.handleAddRowAbove},
			{icon: AddRowBelowIcon, onClick: this.handleAddRowBelow},
			{icon: RemoveColumnIcon, onClick: this.handleDeleteColumn},
			{icon: RemoveRowIcon, onClick: this.handleDeleteRow}
		];

		return (
			<div className={cls(classes.root, {[classes.dragging]: isDragging})}>
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
						onExportOutlines={this.handleExportOutlines}
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
						<div className={classes.controlBar}>
							{actions.map((obj, idx) => (
								<IconButton
									key={idx}
									style={{padding: '0.75rem'}}
									disabled={!focusedBlockPos || !obj.onClick || obj.disabled}
									onClick={obj.onClick}
								>
									<img src={obj.icon} style={{width: '24px'}}/>
								</IconButton>
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
					<div className={classes.content} ref={this.contentRef} onClick={this.handleDocumentClick}>
						<div style={{flex: '0 0 1.3rem', backgroundColor: '#fafafa', width: '100%', position: 'sticky', top: 0, left: 0, zIndex: 1}}></div>
						{timeline ? (
							<>
								{timeline.data.map((rowData, row) => (
									<div
										key={row}
										className={cls(classes.contentRow, {[classes.focus]: row === focusedRow})}
									>
										<div className={classes.rowTitle} onClick={this.getRowClickHandler(row)}>
											{row === focusedRow ? (
												<TextareaAutosize
													value={rowData.title}
													onChange={this.getRowChangeHandler(row)}
													placeholder={`#${row + 1}`}
													spellCheck={false}
													autoFocus
												/>
											) : (
												<pre style={{opacity: rowData.title ? 1 : 0.57}}>
													{(rowData.title || `#${row + 1}`) + ' '}
												</pre>
											)}
										</div>
										<div className={classes.blockListWrapper}>
											{rowData.columns.map((blocks, column) => (
												<BlockList key={`${row}:${column}`} className={classes.blockList}>
													{blocks.map((block, index) => {
														const pos = {row, column, index};
														return this.getBlock(block, pos, isEqual(pos, focusedBlockPos), fullScreen);
													})}
													{blocks.length === 0 && (
														<div className={classes.blockPreview}>
															<Block
																position={{row, column, index: 0}}
																fullScreen={fullScreen}
																onChange={this.handleChangeBlock}
																onClick={this.handleAddPreviewBlock}
																block={previewBlock}
																focused={false}
																onMoveBlock={this.handleDragBlock}
															/>
														</div>
													)}
												</BlockList>
											))}
											<BlockList
												key={`${row}:${rowData.columns.length}`}
												className={cls(classes.blockList, classes.blockListPreview)}
											>
												<div className={classes.blockPreview}>
													<Block
														position={{row, column: rowData.columns.length, index: 0}}
														fullScreen={fullScreen}
														onChange={this.handleChangeBlock}
														onClick={this.handleAddPreviewBlock}
														block={previewBlock}
														focused={false}
														onMoveBlock={this.handleDragBlock}
													/>
												</div>
											</BlockList>
										</div>
									</div>
								))}
								{!isDragging && (
									<div className={classes.contentRowPreview}>
										<div className={classes.rowTitle} onClick={this.handleAddPreviewRow}></div>
										<div className={classes.blockListWrapper}>
											{timeline.data[0]?.columns.map((_blocks, column) => (
												<BlockList key={column} className={classes.blockList}/>
											))}
										</div>
									</div>
								)}
							</>
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
				{focusedBlock && (
					<div
						className={classes.colorChooser}
						style={{display: showColorPicker ? 'flex' : 'none'}}
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
				)}
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

function collect(monitor: any) {
	return {
		isDragging: monitor.isDragging() as boolean
	}
}

export default withMobileDialog()(withAuth(withStyles(styles)(DragLayer<{}, CollectProps>(collect)(App))));
