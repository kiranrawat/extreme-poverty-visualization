import React from 'react';
import './App.css';
import {
    AppHeader,
    LineChart,
    DonutChart,
    RangeChart,
    BankProjectsChart,
    RegionMap
} from './components';

import { Provider } from 'react-redux';

import store from './store';

class App extends React.Component {
    projects = [
        { value: "SI.POV.GAPS", text: 'People % below $1.90/day' },
        { value: "SI.POV.LMIC.GP", text: 'People % below $3.20/day' },
        { value: "SI.POV.UMIC.GP", text: 'People % below $5.50/day' },
        { value: "EN.POP.SLUM.UR.ZS", text: 'People % living in slums' },
    ];

    state = { projectsData: [], povertyYears: [] };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Provider store={store}>
                <AppHeader />
                <div className="app-container">
                    <div>
                        <RegionMap />
                    </div>
                    {/* <h3>
                        How many people are poor?
                    </h3>
                    <div className="world-charts">
                        <LineChart />
                        <div>
                            <DonutChart />
                            <p>
                                The above chart shows people living under $1.90 over different timelines.
                        </p>
                            <p>
                                The world aspect of poverty says that it is decreasing every year as people are being more educated and GDP rising among all economies. However the population to employment ratio over the years seems constant.
                        </p>
                        </div>
                    </div> */}

                    {/* <div>
                        <h3>
                            Where are they located?
                        </h3>
                        <div>
                            <RangeChart />
                        </div>
                    </div>

                    <div>
                        <h3>
                            What is world bank upto?
                        </h3>
                        <div>
                            <BankProjectsChart />
                        </div>
                    </div> */}
                </div>
            </Provider>
        );
    }
}

export default App;
