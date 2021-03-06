import React from 'react';

// Material UI
import Checkbox from 'material-ui/Checkbox';


// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
export default React.createClass({
    propTypes: {
        label: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired,
        items: React.PropTypes.arrayOf(React.PropTypes.shape({
            name: React.PropTypes.string.isRequired,
            value: React.PropTypes.bool,
            text: React.PropTypes.string.isRequired,
        })),
        style: React.PropTypes.object,
    },

    contextTypes: {
        muiTheme: React.PropTypes.object,
    },

    getInitialState() {
        return {
            values: this.props.items.reduce((prev, curr) => {
                if (curr.value) {
                    prev.push(curr.name);
                }
                return prev;
            }, []),
        };
    },

    onToggle(value, event, checked) {
        this.setState((oldState) => {
            if (checked) {
                if (oldState.values.indexOf(value) === -1) {
                    oldState.values.push(value);
                }
            } else if (oldState.values.indexOf(value) !== -1) {
                oldState.values.splice(oldState.values.indexOf(value), 1);
            }
            return oldState;
        }, () => {
            this.props.onChange({ target: { value: this.state.values } });
        });
    },

    render() {
        const style = Object.assign({}, this.context.muiTheme.forms, this.props.style);
        return (
            <div>
                <div style={{ marginTop: 16, marginBottom: 8 }}>{this.props.label}</div>
                {this.props.items.map((item) => {
                    const togglor = this.onToggle.bind(null, item.name); // eslint-disable-line
                    return (
                        <Checkbox
                            key={item.name}
                            name={item.name}
                            value="true"
                            defaultChecked={item.value === true}
                            label={item.text}
                            onCheck={togglor}
                            style={style}
                            labelPosition="right"
                        />
                    );
                })}
            </div>
        );
    },
});
