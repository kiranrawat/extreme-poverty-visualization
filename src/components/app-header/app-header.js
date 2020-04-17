import React from 'react';
import './app-header.css';

class AppHeader extends React.Component {
    render() {
        return (
            <div className="app-header">
                {/* <img src={process.env.PUBLIC_URL + '/poverty-logo.png'} alt="app logo" /> */}
                <div className="title">
                    Extreme Poverty - A global issue
                </div>
            </div>
        );
    }
}

export default AppHeader;
