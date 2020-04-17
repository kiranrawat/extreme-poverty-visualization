import React, { useState, useEffect, useRef } from "react";
import './region-map.css';
import * as d3 from "d3";
import 'd3-selection-multi';

import L, { point } from 'leaflet';
import 'leaflet/dist/leaflet.css';


export default function RegionMap() {
    const leafletChart = {};
    const mapRef = useRef();
    const povChartRef = useRef();
    const gdpChartRef = useRef();
    const employmentRef = useRef();
    const schoolRef = useRef();
    const gdpCorrChartRef = useRef();
    const educationEmpChartRef = useRef();
    const colorInterpolator = d3.interpolateRgb('#cbd7e7', '#052c5e');//'#1e5296');
    const shapes = [
        d3.symbolCircle,
        d3.symbolCircle,
        d3.symbolCircle,
        d3.symbolCircle,
        d3.symbolCircle,
        d3.symbolCircle,
        d3.symbolCircle,
    ];
    let selectedCountryOnMap = null;
    let countryChanged = false;
    let data = {};
    const povProjects = ['EN.POP.SLUM.UR.ZS', 'SI.POV.GAPS', 'SI.POV.LMIC.GP', 'SI.POV.UMIC.GP'];
    const povColors = /*['#d20303'*/['#a65628', '#e67300', '#006699', '#26734d']
    let corrSelection = [];
    const povertySet = {};

    const mapStyle = function (feature) {
        const colorScale = d3.scaleLinear().domain([0, 100]).range([0, 1]);
        let total = 0, dataNum = 0;
        povProjects.forEach(d => {
            if (feature['properties'][d]) {
                total += feature['properties'][d]['pov_mean'];
                dataNum++;
            }
        });
        const meanOfMeans = total / dataNum;
        if (meanOfMeans) {
            return {
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillColor: colorInterpolator(colorScale(meanOfMeans)), //feature['properties']['EN.POP.SLUM.UR.ZS']['pov_mean'])),
                fillOpacity: 1
            };
        } else {
            return {
                opacity: 0,
                fillOpacity: 0
            }
        }
    }

    const onEachFeature = (feature, layer) => {
        if (layer.options.opacity === 0) {
            return;
        }
        layer.on({
            click: (e) => {

                if (selectedCountryOnMap)
                    leafletChart.geoJsonLayer.resetStyle();
                const countries = Array.from(e.originalEvent.target.parentNode.querySelectorAll('path'));
                countries.forEach(country => {
                    if (country !== e.originalEvent.target && country.getAttribute('stroke-width') > 0)
                        country.setAttribute('fill-opacity', '0');
                });

                const data = e.target.feature.properties;
                initCharts(data);

                let layer = e.target;
                selectedCountryOnMap = layer;
                d3.select('.time-chart-area').text(selectedCountryOnMap.feature.properties.name)
                leafletChart.info.update(layer.feature.properties);
                initCorrs(2016, povertySet['WLD'][povProjects[1]]['Indicator Code']);
                countryChanged = true;
                e.originalEvent.preventDefault();
            },
            mouseover: (e) => {
                let layer = e.target;
                leafletChart.info.update(layer.feature.properties);
            },
            mouseout: (e) => {
                leafletChart.info.update();
            }
        });
    }

    const yearsToD3Data = (obj) => {
        const years = Object.keys(obj).map(yr => +yr).filter(d => Number.isFinite(d));
        const data = [];
        years.forEach(year => {
            if (+obj[year] > 0)
                data.push({ year, data: +obj[year] })
        });
        return data;
    }

    const printCorrelations = (year, povIndicator, corrData, containerRef, xExtent, yExtent, colorInterpolator) => {
        // d3.select(containerRef).selectAll('*').remove();
        const d3Svg = d3.select(containerRef).select('svg');
        d3Svg.selectAll('*').remove();
        const chartRect = containerRef.getBoundingClientRect();
        const tooltip = d3.select(containerRef).select('.tooltip');


        const chartMargin = { top: 50, left: 60, right: 30, bottom: 50 };

        const chartData = corrData.reduce((acc, d) => {
            let povD = data.povertySet[d['Country Code']][povIndicator][year];
            let povertyIndicatorName = data.povertySet[d['Country Code']][povIndicator]['Indicator Name'];
            if (povD && d[year])
                acc.push({
                    corr: d[year],
                    countryName: d['Country Name'],
                    countryCode: d['Country Code'],
                    indicatorName: d['Indicator Name'],
                    pov: povD,
                    povertyIndicatorName
                });
            return acc;
        }, []);

        if (chartData.length > 0) {
            const xScale = d3.scaleLinear()
                .domain(xExtent ? xExtent : d3.extent(chartData.map(d => +d['corr'])))
                .range([chartMargin.left, chartRect.width - chartMargin.right]);

            const yScale = d3.scaleLinear()
                .domain(yExtent ? yExtent : d3.extent(chartData.map(d => +d['pov'])))
                .range([chartRect.height - chartMargin.bottom, chartMargin.top]);

            const yAxis = d3.axisLeft().scale(yScale);
            const xAxis = d3.axisBottom().scale(xScale).ticks(7);
            d3Svg.append('g').call(yAxis)
                .attr('transform', `translate(${chartMargin.left}, 0)`);

            d3Svg.append('g').call(xAxis)
                .attr('transform', `translate(0, ${chartRect.height - chartMargin.bottom})`);

            const colorScale = d3.scaleLinear()
                .domain(d3.extent(chartData.map(d => +d['pov'])))
                .range([0, 1]);

            let pointsContainer = d3Svg.append('g');
            pointsContainer
                .selectAll('circle')
                .data(chartData)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(+d['corr']))
                .attr('cy', d => yScale(+d['pov']))
                .attr('fill-opacity', 0.5)
                .attr('r', d => 4)//(selectedCountryOnMap && d['countryCode'] === selectedCountryOnMap.feature.id) ? 8 : 4)
                .attr('fill', d => (selectedCountryOnMap && d['countryCode'] === selectedCountryOnMap.feature.id) ? 'red' : colorInterpolator(1))//colorInterpolator(colorScale(+d['pov'])))
                .attr('stroke', d => (selectedCountryOnMap && d['countryCode'] === selectedCountryOnMap.feature.id) ? 'black' : 'transparent')
                .on('mousemove', function (d, i) {
                    const mouseCoordinates = d3.mouse(document.body);
                    tooltip
                        .style('display', 'block')
                        .style('top', mouseCoordinates[1] + 'px')
                        .style('left', mouseCoordinates[0] + 'px')
                        .html(`${d['countryName']} <hr> ${d['povertyIndicatorName']}: ${d['pov']} <br> ${d['indicatorName']}: ${(+d['corr']).toFixed(2)}`);
                })
                .on('mouseout', function () {
                    tooltip.style('display', 'none');
                });


            d3Svg
                .on('mousedown', function () {
                    let p = d3.mouse(this);
                    d3Svg.append("rect")
                        .attrs({
                            rx: 6,
                            ry: 6,
                            class: "selection",
                            x: p[0],
                            y: p[1],
                            width: 0,
                            height: 0
                        });

                    corrSelection = [];
                    d3.selectAll('.correlations-charts circle.selected').classed('selected', false);
                })
                .on('mousemove', function () {
                    let s = d3Svg.select("rect.selection");

                    if (!s.empty()) {
                        let p = d3.mouse(this),
                            d = {
                                x: parseFloat(s.attr("x"), 10),
                                y: parseFloat(s.attr("y"), 10),
                                width: parseFloat(s.attr("width"), 10),
                                height: parseFloat(s.attr("height"), 10)
                            },
                            move = {
                                x: p[0] - d.x,
                                y: p[1] - d.y
                            };

                        if (move.x < 1 || (move.x * 2 < d.width)) {
                            d.x = p[0];
                            d.width -= move.x;
                        } else {
                            d.width = move.x;
                        }

                        if (move.y < 1 || (move.y * 2 < d.height)) {
                            d.y = p[1];
                            d.height -= move.y;
                        } else {
                            d.height = move.y;
                        }

                        s.attrs(d);
                        d3.selectAll('.correlations-charts circle.selected').classed('selected', false);
                        pointsContainer.selectAll('circle').each(function () {
                            const point = d3.select(this);
                            const x = point.attr('cx');
                            const y = point.attr('cy');
                            if (!point.classed('selected') && x > d.x && x <= d.x + d.width && y > d.y && y <= d.y + d.height) {
                                point.classed('selected', true);
                                corrSelection.push(point.datum().countryCode);
                                d3.selectAll('.correlations-charts circle').filter(d => corrSelection.indexOf(d.countryCode) > 0).classed('selected', true);
                            }
                        });
                    }
                })
                .on('mouseup', () => {
                    d3Svg.selectAll("rect.selection").remove();
                })


            // X axis label
            d3Svg.append('text')
                .text(chartData[0]['indicatorName'])
                .style('font-size', '9pt')
                .attr('x', function () {
                    return chartRect.width / 2 - this.getBoundingClientRect().width / 2;
                })
                .attr('y', chartRect.height - chartMargin.bottom + 40);

            // Y axis label
            d3Svg.append('text')
                .text(chartData[0]['povertyIndicatorName'])
                .style('font-size', '9pt')
                .attr('x', function () {
                    return -(this.getBoundingClientRect().width + 30);
                })
                .attr('y', function () {
                    return 20;
                })
                .attr('transform', 'rotate(-90, 0, 0)');

            // Year label
            d3Svg.append('text')
                .text('Year: ' + year)
                .styles({
                    'font-size': '9pt',
                    'font-weight': 'bold'
                })
                .attrs(function (d, i) {

                    return {
                        x: chartRect.width - this.getBoundingClientRect().width - 30,
                        y: chartMargin.top - 10
                    }
                });
        } else {
            d3Svg.append('text')
                .text('No Data Found')
                .attr('x', function () {
                    return chartRect.width / 2 - this.getBoundingClientRect().width / 2;
                })
                .attr('y', chartRect.height / 2)
        }

    }

    const printCharts = (chartData, projects, colors, xExtent, yExtent, chartRef, applyClick, yLabel) => {
        let symbolGenerator = d3.symbol().size(50);
        const d3Svg = d3.select(chartRef).select('svg');
        const tooltip = d3.select(chartRef).select('.tooltip');
        const chartRect = chartRef.getBoundingClientRect();
        const chartMargin = { top: 90, left: 70, right: 30, bottom: 50 };
        let timeParser = d3.timeParse('%Y');
        let xScale = d3.scaleTime()
            .domain(xExtent.map(d => timeParser(d)))
            .range([chartMargin.left, chartRect.width - chartMargin.right]);

        let yScale = {};
        if (yExtent) {
            yScale = d3.scaleLinear()
                .domain(yExtent)
                .range([chartRect.height - chartMargin.bottom, chartMargin.top]);
        }

        d3Svg.selectAll('*').remove();
        for (let projIdx = 0; projIdx < projects.length; projIdx++) {
            const projObj = chartData[projects[projIdx]];
            const yD3Data = yearsToD3Data(projObj);
            if (projIdx === 0) {

                if (!yExtent) {
                    yScale = d3.scaleLinear()
                        .domain(d3.extent(yD3Data.map(x => x['data'])))
                        .range([chartRect.height - chartMargin.bottom, chartMargin.top]);

                    // xScale = d3.scaleTime()
                    //     .domain(d3.extent(yD3Data.map(x => timeParser(x['year']))))
                    //     .range([chartMargin.left, chartRect.width - chartMargin.right]);
                }

                const yAxis = d3.axisLeft().scale(yScale);
                const xAxis = d3.axisBottom().scale(xScale);
                d3Svg.append('g').call(yAxis)
                    .attr('transform', `translate(${chartMargin.left}, 0)`);

                d3Svg.append('g').call(xAxis)
                    .attr('transform', `translate(0, ${chartRect.height - chartMargin.bottom})`);

            }

            const projectChart = d3Svg.append('g');

            projectChart.append('g')
                .append('path')
                .datum(yD3Data)
                .attrs({
                    'fill': 'none',
                    'stroke': colors[projIdx],
                    'stroke-width': '2',
                })
                .attr('d', d => d3.line()
                    .x(d => xScale(timeParser(d['year'])))
                    .y(d => yScale(d['data']))(d)
                )
                .style('opacity', 0.5);

            // datapoints for this chart
            const points = projectChart.append('g')
                .selectAll('path')
                .data(yD3Data)
                .enter()
                .append('path')
                .attr('class', 'datapoint')
                .attr('fill', colors[projIdx])
                .attr('d', (symbolGenerator.type(shapes[projIdx]).size(20))())
                .attr('transform', (d) => `translate(${xScale(timeParser(d['year']))}, ${yScale(d['data'])})`)
                .on('mouseover', function (d, i) {
                    const mousePosition = d3.mouse(document.body);
                    tooltip
                        .style('top', mousePosition[1] + 'px')
                        .style('left', mousePosition[0] + 'px')
                        .style('display', 'block')
                        .html(`Year: ${d['year']} <br> ${chartData[projects[projIdx]]['Indicator Name']}: ${d['data'].toFixed(2)}`);
                })
                .on('mouseout', function (d, i) {
                    tooltip.style('display', 'none');
                });
            if (applyClick) {
                points.on('click', function (d, i) {
                    d3Svg.selectAll('path.datapoint').classed('selected', false);
                    d3.select(this).classed('selected', true);
                    initCorrs(d['year'], chartData[projects[projIdx]]['Indicator Code'], d3.interpolateRgb('#cbd7e7', d3.select(this).attr('fill')));
                });
            }
        }

        const legend = d3Svg.append('g');

        // Legend symbols
        legend.selectAll('path')
            .data(projects)
            .enter()
            .append('path')
            .attr('fill', (d, i) => colors[i])
            .attr('d', (d, i) => (symbolGenerator.type(shapes[i]).size(70))())
            .attr('transform', (d, i) => `translate(100, ${chartMargin.top - 20 - i * 15})`);

        // Legend labels
        legend.selectAll('text')
            .data(projects.map(d => chartData[d]['Indicator Name']))
            .enter()
            .append('text')
            .text(d => d)
            .attr('x', 110)
            .attr('y', (d, i) => chartMargin.top - 15 - i * 15)
            // .attr('fill', (d, i) => colors[i])
            .style('font-size', '9pt');


        // Axis Labels
        d3Svg.append('text')
            .text(yLabel)
            .attrs(function () {
                return {
                    transform: 'rotate(-90,0,0)',
                    x: -(chartRect.height - this.getBoundingClientRect().width),
                    y: 20
                };
            })
            .styles({
                'font-size': '9pt'
            });

        d3Svg.append('text')
            .text('Years')
            .attrs(function () {
                return {
                    x: chartRect.width / 2 - this.getBoundingClientRect().width / 2,
                    y: chartRect.height - 15
                };
            })
            .styles({
                'font-size': '9pt'
            });

        //Country label
        // d3Svg.append('text')
        //     .text('Area: ' + chartData[projects[0]]['Country Name'])
        //     .attrs(function () {
        //         return {
        //             x: chartMargin.left,
        //             y: chartRect.height - 5
        //         };
        //     })
        //     .styles({
        //         'font-size': '9pt',
        //         'font-weight': 'bold'
        //     });
    }

    const printMap = () => {
        leafletChart.map = L.map(mapRef.current, {
            maxZoom: 3,
            minZoom: 2,
            zoomControl: false
        }).setView([51.505, -0.09], 2);
        // const token = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        // leafletChart.mpaLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${token}`, {
        //     maxZoom: 3,
        //     minZoom: 2,
        //     attribution: '',
        //     id: 'mapbox/light-v9',
        //     tileSize: 512,
        //     zoomOffset: -1,
        //     noWrap: true
        // }).addTo(leafletChart.map);


        leafletChart.geoJsonLayer = L.geoJson(data.geoJsonData, { style: mapStyle, onEachFeature: onEachFeature });
        leafletChart.geoJsonLayer.addTo(leafletChart.map);

        leafletChart.info = L.control();

        leafletChart.info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        leafletChart.map.on('click', c => {
            if (!countryChanged) {
                leafletChart.geoJsonLayer.resetStyle();
                selectedCountryOnMap = null;
                initCharts(data.povertySet['WLD']);
                leafletChart.info.update();
                d3.select('.time-chart-area').text('World')
            } else {
                countryChanged = false;
            }

        });

        // method that we will use to update the control based on feature properties passed
        leafletChart.info.update = function (props) {
            let propertyLabel = '';
            if (props) {
                propertyLabel = `<div class="heading">${props.name}</div><hr>`;
                propertyLabel += Object.keys(props).reduce((accumulator, currentValue) => {
                    let cv = props[currentValue];
                    if (cv['Indicator Name'] && cv['pov_mean'])
                        return accumulator + `<div>${cv['Indicator Name']}: ${cv['pov_mean'].toFixed(2)}%</div>`;
                    else
                        return accumulator;
                }, '');
            }
            else if (selectedCountryOnMap) {
                // selectedCountryOnMap.setStyle({
                //     weight: 5,
                //     color: '#fff',
                //     dashArray: '5 5',
                //     // fillColor: '#d20303',
                //     fillColor: '#808080',
                //     fillOpacity: 1
                // });
                props = selectedCountryOnMap.feature.properties;
                propertyLabel = `<div class="heading">${props.name}</div><hr>`;
                propertyLabel += Object.keys(props).reduce((accumulator, currentValue) => {
                    let cv = props[currentValue];
                    if (cv['Indicator Name'] && cv['pov_mean'])
                        return accumulator + `<div>${cv['Indicator Name']}: ${cv['pov_mean'].toFixed(2)}%</div>`;
                    else
                        return accumulator;
                }, '');
            } else {
                propertyLabel = '<div class="heading">Poverty Stats</div>';
                propertyLabel += '<b>Hover over a country or click to see the poverty stats</b>';
            }
            this._div.innerHTML = propertyLabel;
        };

        leafletChart.info.addTo(leafletChart.map);

        let legend = L.control({ position: 'bottomleft' });
        const colorScale = d3.scaleLinear().domain([0, 100]).range([0, 1]);

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            let finalValue = grades.reduce((acc, currentValue, idx) => {
                acc += `
                    <div>
                    <div style="width:40px; height:30px; background:${colorInterpolator(colorScale(currentValue))};"></div>
                    <div>${currentValue}%</div>
                    </div>
                `;
                return acc;
            }, '');

            div.innerHTML = `<div class="color-pallete">${finalValue}</div>`;


            return div;
        };

        legend.addTo(leafletChart.map);

        let heading = L.control({ position: 'topleft' });
        heading.onAdd = function (map) {
            let div = L.DomUtil.create('div', 'info header');
            div.innerText = "Percentage of population under Extreme Poverty across the World";
            return div;
        }
        heading.addTo(leafletChart.map);
    }

    const initCorrs = (year, chartData, colorInterpolator) => {
        colorInterpolator = colorInterpolator ? colorInterpolator : d3.interpolateRgb('#cbd7e7', '#e67300');
        printCorrelations(year, chartData, data.educationData, schoolRef.current, null, null, colorInterpolator);
        printCorrelations(year, chartData, data.employmentData, employmentRef.current, null, null, colorInterpolator);
        printCorrelations(year, chartData, data.gdpData, gdpCorrChartRef.current, null, [0, 100], colorInterpolator);
    }

    const initCharts = (data) => {
        printCharts(data, povProjects, povColors, [1970, 2020], [0, 100], povChartRef.current, true, 'Population %');
        printCharts(data, ['edu', 'emp'], ['#D308B8 ', '#f4c20d'], [1970, 2020], [0, 100], educationEmpChartRef.current, false, 'Population %');
        printCharts(data, ['gdp'], ['#6C3483'], [1970, 2020], null, gdpChartRef.current, false, 'GDP per capita');
    }

    const fetchData = async () => {
        const geoDataUrl = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
        const projectsDataUrl = process.env.PUBLIC_URL + '/data/country_projects.json';
        const povertyDataUrl = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
        const gdpDataUrl = process.env.PUBLIC_URL + '/data/gdp.csv';
        const educationDataUrl = process.env.PUBLIC_URL + '/data/school_enroll.csv';
        const employmentDataUrl = process.env.PUBLIC_URL + '/data/employment.csv';

        //fetch the data
        let geoJsonData = await fetch(geoDataUrl);
        const projectsData = await d3.json(projectsDataUrl);
        const povertyData = await d3.csv(povertyDataUrl);
        geoJsonData = await geoJsonData.json();
        const gdpData = await d3.csv(gdpDataUrl);

        const educationData = await d3.csv(educationDataUrl);
        const employmentData = await d3.csv(employmentDataUrl);
        gdpData.forEach(d => {
            if (!povertySet[d['Country Code']])
                povertySet[d['Country Code']] = {};
            povertySet[d['Country Code']]['gdp'] = d;
        });

        educationData.forEach(d => {
            let yrs = Object.keys(d).map(x => +x).filter(x => Number.isFinite(x));
            yrs.forEach(x => {
                if (d[x] > 100)
                    d[x] = 100;
                if (!Number.isFinite(+d[x]))
                    d[x] = 0;
            });
            if (!povertySet[d['Country Code']])
                povertySet[d['Country Code']] = {};
            povertySet[d['Country Code']]['edu'] = d;
        });

        employmentData.forEach(d => {
            if (!povertySet[d['Country Code']])
                povertySet[d['Country Code']] = {};
            povertySet[d['Country Code']]['emp'] = d;
        });

        povertyData.forEach(d => {
            if (!povertySet[d['Country Code']])
                povertySet[d['Country Code']] = {};
            povertySet[d['Country Code']][d['Indicator Code']] = d;
            const vals = Object.values(d).map(x => +x);
            let count = 0;
            const sum = vals.reduce((accumulator, currentValue) => {
                if (Number.isFinite(currentValue) && currentValue > 0) {
                    count++;
                    return accumulator + currentValue;
                }
                return accumulator;
            }, 0);
            povertySet[d['Country Code']][d['Indicator Code']]['pov_mean'] = sum / (count === 0 ? 1 : count);
        });

        geoJsonData.features.forEach(d => {
            d.properties = Object.assign({}, d.properties, povertySet[d['id']]);
        });

        const projs = Object.values(projectsData).map(a => a.projects);
        projs.pop();
        data = { geoJsonData, projectsData, povertySet, povertyData, educationData, employmentData, gdpData };

        printMap();
        // console.log('geoJSON', geoJsonData, employmentData, educationData);
        initCharts(povertySet['WLD']);
        initCorrs(2016, povertySet['WLD'][povProjects[1]]['Indicator Code']);
    }

    useEffect(() => {
        fetchData();
        d3.select(schoolRef.current)
            .select('svg')
            .append('text')
            .text('Select Poverty measure & Year from top right chart.')
            .attr('x', function () {
                return this.parentNode.getBoundingClientRect().width / 2 - this.getBoundingClientRect().width / 2;
            })
            .attr('y', function () {
                return this.parentNode.getBoundingClientRect().height / 2;
            })
    }, []);

    return (
        <div className="region-map">
            <div className="region-charts">
                <div className="leaflet-map">
                    <div ref={mapRef} className="map-container"></div>
                </div>
                <div className="year-chart-container">
                    <div className="heading">
                        How do Poverty gaps and various factors over the years are changing?
                        <div className="time-chart-area">World</div>
                    </div>
                    <div className="year-charts">
                        <div ref={povChartRef}>
                            <svg ></svg>
                            <div className="tooltip"></div>
                        </div>
                        <div ref={educationEmpChartRef}>
                            <svg ></svg>
                            <div className="tooltip"></div>
                        </div>
                        <div ref={gdpChartRef}>
                            <svg ></svg>
                            <div className="tooltip"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="correlations-chart-container">
                <div className="heading">
                    How does poverty relate to the factors like employment, school enrollment and economy (GDP per capita)?
                </div>
                <div className="correlations-charts">
                    <div ref={schoolRef}>
                        <svg></svg>
                        <div className="tooltip"></div>
                    </div>
                    <div ref={employmentRef}>
                        <svg></svg>
                        <div className="tooltip"></div>
                    </div>
                    <div ref={gdpCorrChartRef}>
                        <svg></svg>
                        <div className="tooltip"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}