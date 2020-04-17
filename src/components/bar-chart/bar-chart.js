import React from 'react';
import './bar-chart.css';
import * as d3 from "d3";
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

class BarChart extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            id: 'barchart-' + uuidv4()
        };
    }

    createChart(x, y) {
        let svg = d3.select(`#${this.state.id}`)
            .style('height', '50vh')
            .style('width', '100%')
            .style('border', '1px solid black');

        let svgHeight = svg.node().getBoundingClientRect().height;

        let yScale = d3.scaleLinear()
            .domain([_.min(y), _.max(y)])
            .range([10, svgHeight - 20]);

        let bars = svg
            .append('g')
            .selectAll('rect')
            .data(_.zip(x, y))
            .enter()
            .append('rect');

        bars.attr('height', d => yScale(d[1]))
            .attr('width', 10)
            .attr('x', (d, i) => i * 20)
            .attr('y', (d, i) => svgHeight - yScale(d[1]) - 10);

    }

    componentDidMount() {
        let url = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
        d3.csv(url).then(data => {
            let countries = [];
            let povertyStats = [];
            for (let idx = 0; idx < data.length; idx++) {
                let dataPoint = data[idx];
                if (dataPoint[2010] !== '' && dataPoint['Indicator Code'] === 'SI.POV.DDAY') {
                    countries.push(dataPoint["Country Name"]);
                    povertyStats.push(Number.parseFloat(dataPoint[2010]));
                }
            }
            this.createChart(countries, povertyStats);
        });
    }

    render() {

        return (
            <div className="bar-chart">
                <svg id={this.state.id}></svg>
            </div>
        );
    }
}

export default BarChart;
