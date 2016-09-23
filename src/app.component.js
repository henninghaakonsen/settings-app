import React from 'react';

// Material UI
import Snackbar from 'material-ui/lib/snackbar';

// D2 UI
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import Sidebar from 'd2-ui/lib/sidebar/Sidebar.component';

// App
import SettingsFields from './settingsFields.component.js';
import AppTheme from './theme';

import settingsActions from './settingsActions';
import { categoryOrder, categories } from './settingsCategories';
import configOptionStore from './configOptionStore';

// Routing / browser history manipulation
import createHistory from 'history/createHashHistory';


const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

const styles = {
    header: {
        fontSize: 24,
        fontWeight: 300,
        color: AppTheme.rawTheme.palette.textColor,
        padding: '24px 0 12px 16px',
    },
    card: {
        marginTop: 8,
        marginRight: '1rem',
        padding: '0 1rem',
    },
    cardTitle: {
        background: AppTheme.rawTheme.palette.primary2Color,
        height: 62,
    },
    cardTitleText: {
        fontSize: 28,
        fontWeight: 100,
        color: AppTheme.rawTheme.palette.alternateTextColor,
    },
    noHits: {
        padding: '1rem',
        marginTop: '1rem',
        fontWeight: 300,
    },
    userSettingsOverride: {
        color: AppTheme.rawTheme.palette.accent1Color,
        marginTop: -6,
        fontSize: '0.8rem',
        fontWeight: 400,
    },
    menuIcon: {
        color: '#757575',
    },
    menuLabel: {
        position: 'relative',
        top: -6,
        marginLeft: 16,
    },
};

class AppComponent extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            category: categoryOrder[0],
            currentSettings: categories[categoryOrder[0]].settings,
            snackbarMessage: '',
            showSnackbar: false,
            formValidator: undefined,
        };

        this.closeSnackbar = this.closeSnackbar.bind(this);
        this.doSearch = this.doSearch.bind(this);
    }

    getChildContext() {
        return {
            d2: this.props.d2,
            muiTheme: AppTheme,
        };
    }

    componentDidMount() {
        this.subscriptions = [];

        this.subscriptions.push(configOptionStore.subscribe(() => {
            // Must force update here in order to redraw form fields that require config options
            // TODO: Replace this with async select fields
            this.forceUpdate();
        }));

        /* eslint-disable complexity */
        this.subscriptions.push(settingsActions.setCategory.subscribe((arg) => {
            const category = arg.data.key || arg.data || categoryOrder[0];
            const searchResult = arg.data.settings || [];
            const currentSettings = category === 'search' ? searchResult : categories[category].settings;

            if (category !== 'search') {
                this.sidebar.clearSearchBox();
            }

            const pathname = `/${category}`;
            const search = category === 'search'
                ? `?${encodeURIComponent(arg.data.searchTerms.join(' '))}`
                : '';

            if (pathname !== this.history.location.pathname || search !== this.history.location.search) {
                this.history.push({ pathname, search });
            }

            this.setState({
                category,
                currentSettings,
                searchText: category === 'search' ? this.state.searchText : '',
            });
        }));
        /* eslint-enable complexity */

        this.subscriptions.push(settingsActions.showSnackbarMessage.subscribe(params => {
            const message = params.data;
            this.setState({ snackbarMessage: message, showSnackbar: !!message });
        }));

        // Helper function for setting app state based on location
        var navigate = (location) => {
            const section = location.pathname.substr(1);
            if (location.pathname === '/search') {
                const search = decodeURIComponent(location.search.substr(1));
                this.doSearch(search);
            } else if (Object.keys(categories).includes(section)) {
                settingsActions.setCategory(section);
            } else {
                this.history.replace(`/${categoryOrder[0]}`);
                settingsActions.setCategory(categoryOrder[0]);
            }
        };

        // Listen for location changes and update app state as necessary
        this.history = createHistory();
        this.unlisten = this.history.listen((location, action) => {
            if (action === 'POP') {
                navigate(location);
            }
        });

        // Set initial app state based on current location
        navigate(this.history.location);
    }

    componentWillUnmount() {
        this.subscriptions.forEach(sub => {
            sub.dispose();
        });

        this.unlisten && this.unlisten();
    }

    closeSnackbar() {
        this.setState({ showSnackbar: false });
    }

    doSearch(searchText) {
        this.setState({ searchText });
        settingsActions.searchSettings(searchText);
    }

    render() {
        const sections = Object.keys(categories).map(category => {
            const key = category;
            const label = this.props.d2.i18n.getTranslation(categories[category].label);
            const icon = categories[category].icon;
            return { key, label, icon };
        });
        const setSidebar = (ref) => {
            this.sidebar = ref;
        };

        return (
            <div className="app">
                <HeaderBar />
                <Snackbar
                    message={this.state.snackbarMessage || ''}
                    autoHideDuration={1250}
                    open={this.state.showSnackbar}
                    onRequestClose={this.closeSnackbar}
                    style={{ left: 24, right: 'inherit' }}
                />
                <Sidebar
                    sections={sections}
                    onChangeSection={settingsActions.setCategory}
                    currentSection={this.state.category}
                    showSearchField
                    searchFieldLabel={this.props.d2.i18n.getTranslation('search_settings')}
                    ref={setSidebar}
                    onChangeSearchText={this.doSearch}
                    searchText={this.state.searchText}
                />

                <SettingsFields category={this.state.category} currentSettings={this.state.currentSettings}/>
            </div>
        );
    }
}

AppComponent.propTypes = { d2: React.PropTypes.object.isRequired };
AppComponent.contextTypes = { muiTheme: React.PropTypes.object };
AppComponent.childContextTypes = { d2: React.PropTypes.object, muiTheme: React.PropTypes.object };

export default AppComponent;
