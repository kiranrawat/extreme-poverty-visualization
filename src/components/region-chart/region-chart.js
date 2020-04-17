import * as d3 from "d3";
import _ from 'lodash';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import './region-chart.css';
import { connect } from 'react-redux';

class RegionChart extends React.Component {
    // dataContext = React.useContext(PovertyContext);

    constructor(props) {
        super(props);
        this.state = {
            id: 'regionchart-' + uuidv4(),
            indicator: 'SI.POV.GAPS',
            yearsCount: 5,
            selectedYear: 0,
        };
    }

    createChart(x, y) {
        let svg = d3.select(`#${this.state.id}`)
            .style('height', '50vh')
            .style('width', '100%')
            .style('border', '1px solid black');

        let svgHeight = svg.node().getBoundingClientRect().height;

        let yScale = d3.scaleLinear()
            .domain(d3.extent(y))
            .range([10, svgHeight - 20]);

        let bars = svg
            .append('g')
            .selectAll('rect')
            .data(_.zip(x, y))
            .enter()
            .append('rect');

        bars.attr('height', d => yScale(d[1]))
            .attr('width', 2)
            .attr('x', (d, i) => i * 5)
            .attr('y', (d, i) => svgHeight - yScale(d[1]) - 10);

    }

    initData() {
        // let projects = [
        //     { value: "SI.POV.GAPS", text: 'People % below $1.90/day' },
        //     { value: "SI.POV.LMIC.GP", text: 'People % below $3.20/day' },
        //     { value: "SI.POV.UMIC.GP", text: 'People % below $5.50/day' },
        //     { value: "EN.POP.SLUM.UR.ZS", text: 'People % living in slums' },
        // ];
        // let projectSelector = d3.select(`#${this.state.id} .inputs select`);
        // projectSelector
        //     .selectAll('option')
        //     .data(projects)
        //     .enter()
        //     .append('option')
        //     .attr('value', d => d.value)
        //     .text(d => d.text);

        // let dataUrl = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
        // d3.csv(dataUrl).then(data => {
        //     let projectIndicators = projects.map(d => d.value);
        //     this.povertyData = data
        //         .filter(d => projectIndicators.indexOf(d['Indicator Code']) > 0);
        //     this.povertyYears = Object.keys(povertyData[0]).map(d => +d).filter(d => d > 0);
        //     this.setState(Object.assign({}, this.state, { yearsCount: this.povertyYears.length - 1 }));
        // });

    }

    // filterData(project, year) {
    //     // Get data for the above projects
    //     let currentData = this.props.data.filter(d => d['Indicator Code'] === project && d[year] !== '');
    //     let x = currentData.map(d => d['Country Name']);
    //     let y = currentData.map(d => +d[year]);

    //     // for (let idx = 0; idx < data.length; idx++) {
    //     //     let dataPoint = data[idx];
    //     //     if (dataPoint[2010] !== '' && dataPoint['Indicator Code'] === 'SI.POV.DDAY') {
    //     //         countries.push(dataPoint["Country Name"]);
    //     //         povertyStats.push(Number.parseFloat(dataPoint[2010]));
    //     //     }
    //     // }
    //     this.createChart(x, y);
    // }

    componentDidMount() {

        let selectedYear = this.props.years[this.state.selectedYear];
        this.filterData(this.state.indicator, selectedYear)
        // let url = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
        // d3.csv(url).then(data => {
        //     let countries = [];
        //     let povertyStats = [];
        //     this.povertyData = data;
        //     this.povertyYears = Object.keys(data[0]).map(d => +d).filter(d => d > 0);
        //     this.setState(Object.assign({}, this.state, { yearsCount: this.povertyYears.length - 1 }));
        //     for (let idx = 0; idx < data.length; idx++) {
        //         let dataPoint = data[idx];
        //         if (dataPoint[2010] !== '' && dataPoint['Indicator Code'] === 'SI.POV.DDAY') {
        //             countries.push(dataPoint["Country Name"]);
        //             povertyStats.push(Number.parseFloat(dataPoint[2010]));
        //         }
        //     }
        //     this.createChart(countries, povertyStats);
        // });
    }

    indicatorSelection(event) {

        this.setState(Object.assign({}, this.state, { indicator: event.currentTarget.value }));
        // this.updateMap();
    }

    yearSelection(event) {
        this.setState(Object.assign({}, this.state, { selectedYear: event.currentTarget.value }));
        // this.updateMap();
    }

    render() {
        return (
            <div id={this.state.id} className="region-chart">
                <div className="inputs">
                    <select value={this.state.indicator} onChange={ev => this.indicatorSelection(ev)}>
                        <option value="SI.POV.GAPS" >People % below $1.90/day</option>
                        <option value="SI.POV.LMIC.GP" >People % below $3.20/day</option>
                        <option value="SI.POV.UMIC.GP" >People % below $5.50/day</option>
                        <option value="EN.POP.SLUM.UR.ZS" >People % living in slums</option>
                    </select>
                    <input type='range' step="1" min="0" max={this.state.yearsCount} value={this.state.selectedYear} onChange={ev => this.yearSelection(ev)} />
                </div>
                <svg ></svg>
            </div>
        );
    }
}

export default RegionChart;
