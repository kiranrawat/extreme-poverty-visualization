import React from 'react';
import './donut-chart.css';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';


// ToDo: Create a speedometer of population count under poverty as of
class DonutChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 'donutchart-' + uuidv4()
        };
    }

    componentDidMount() {
        this.getData().then(data => {
            let stateData = {
                population: data['total_population'],
                povertyPercent: data['poverty_percent']
            };
            this.setState(Object.assign(stateData, this.state));
            this.yearRangeInput();
        });
    }

    createDonutChart(svg, year) {
        let tau = Math.PI / 2;
        svg.selectAll("*").remove();

        let povertyPercent = +this.state.povertyPercent[year];
        let population = +this.state.population[year];
        let colors = { pop: '#639a67', poverty: '#b80d57' }// '#fa4252' }

        let svgRect = svg.node().getBoundingClientRect();
        let width = svgRect.width;
        let height = svgRect.height;
        let minOfHeightWidth = d3.min([height, width]);
        let populationArc = d3.arc().innerRadius(minOfHeightWidth - 40).outerRadius(minOfHeightWidth - 5).startAngle(-Math.PI / 2);

        let topContainer = svg.append('g').attr('transform', `translate(${width / 2}, ${height})`);
        topContainer.append('path')
            .datum({ endAngle: tau })
            .style('fill', colors.pop)
            .attr('d', populationArc);

        let arcScale = d3.scaleLinear().domain([0, 100]).range([Math.PI / 2, -Math.PI / 2]);
        let povertyArc = d3.arc().innerRadius(minOfHeightWidth - 40).outerRadius(minOfHeightWidth - 5).startAngle(arcScale(0));
        topContainer.append('g')
            .append('path')
            .datum({ endAngle: arcScale(povertyPercent), year: year })
            .attr('fill', colors.poverty)
            .attr('d', povertyArc);

        let textNode = svg.append('text')
            .attr('y', (height - 40))
            .style('font-size', '22pt')
            .style('font-family', 'helvetica')
            .style('fill', colors.poverty)
            .text(Math.floor(povertyPercent * population / 100).toLocaleString());

        textNode.attr('x', (width / 2) - (textNode.node().getBoundingClientRect().width) / 2);

        textNode = svg.append('text')
            .attr('y', (height - 10))
            .style('font-size', '18pt')
            .style('font-family', 'helvetica')
            .style('fill', colors.pop)
            .text((population).toLocaleString());

        textNode.attr('x', (width / 2) - (textNode.node().getBoundingClientRect().width) / 2);
    }

    yearRangeInput() {
        let chartSvg = d3.select('#' + this.state.id).append('svg').style('width', '100%').style('height', '20vh');
        let containerDiv = d3.select('#' + this.state.id).append('div').style('display', 'flex').append('div').style('margin', 'auto');
        let yearInput = containerDiv.append('input');
        let yearValueDiv = containerDiv.append('div');
        let years = Object.keys(this.state.povertyPercent);
        yearInput
            .attr('type', 'range')
            .attr('step', '1')
            .attr('min', '0')
            .attr('value', '0')
            .attr('max', years.length - 1)
            .on('change', (e) => {
                let newValue = yearInput.node().value;
                yearValueDiv.text('Year: ' + years[newValue]);
                this.createDonutChart(chartSvg, years[newValue]);
            });
        yearValueDiv.text('Year: ' + years[0]);
        this.createDonutChart(chartSvg, years[0]);
        let i = 0;
        let interval = setInterval(() => {
            yearInput.attr('value', i++);
            yearInput.on("change")();
            if (i >= years.length)
                clearInterval(interval);
        }, 500);
    }

    getData() {
        let worldDataUrl = process.env.PUBLIC_URL + '/data/world_pop_poverty.json';
        return d3.json(worldDataUrl).then(data => {
            return data;
        });
    }

    render() {
        return (
            <div id={this.state.id} className="world-donut">
            </div>
        );
    }
}

export default DonutChart;
