import React, { Component } from 'react';
import './leaflet-chart.css';
import L from 'leaflet';
import { v4 as uuidv4 } from 'uuid';
import 'leaflet/dist/leaflet.css';
import * as d3 from "d3";
import _ from 'lodash';

export default class LeafletChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 'map-' + uuidv4(),
            indicator: 'SI.POV.GAPS',
            yearsCount: 5,
            selectedYear: 0,
        };
    }

    initData() {
        let povertyDataUrl = process.env.PUBLIC_URL + '/data/poverty_1.9.csv';
        let geoDataUrl = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

        //fetch the data
        let geoJsonPromise = fetch(geoDataUrl)
            .then(d => d.json());

        return Promise.all([geoJsonPromise, d3.csv(povertyDataUrl)])
            .then(data => {
                this.geoData = data[0];
                this.povertyData = data[1];
                this.povertyYears = Object.keys(data[1][0]).map(d => +d).filter(d => d > 0);
                this.setState(Object.assign({}, this.state, { yearsCount: this.povertyYears.length - 1 }));
                return true;
            });
    }

    style(feature) {
        let style = {};
        let selectedYear = this.povertyYears[this.state.selectedYear];
        let povertyValue = +(this.oneNinePoverty && this.oneNinePoverty[feature.id] && this.oneNinePoverty[feature.id][selectedYear]);
        if (povertyValue > 0) {
            if (povertyValue < 5) {
                style = {
                    fillColor: 'green',
                    fillOpacity: 0.5,
                    color: 'white',
                    weight: 1
                };
            }
            else if (povertyValue < 25) {
                style = {
                    fillColor: 'blue',
                    fillOpacity: 0.3,
                    color: 'white',
                    weight: 1
                };
            }
            else if (povertyValue < 50) {
                style = {
                    fillColor: 'red',
                    fillOpacity: 0.5,
                    color: 'white',
                    weight: 1
                };
            } else if (povertyValue < 100) {
                style = {
                    fillColor: 'red',
                    fillOpacity: 0.7,
                    color: 'white',
                    weight: 1
                };
            }
        } else {
            style = {
                fillColor: '#a99f96',
                fillOpacity: 1,
                color: 'white',
                weight: 1
            };
        }

        return style;
    }

    initMap() {
        this.oneNinePoverty = {};
        let singlePrjData = this.povertyData.filter(d => d['Indicator Code'] === this.state.indicator);
        _.forEach(singlePrjData, (d) => {
            this.oneNinePoverty[d['Country Code']] = d;
        });

        this.mymap = L.map(document.getElementById(this.state.id).querySelector('.map-container')).setView([51.505, -0.09], 2);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            maxZoom: 18,
            attribution: '',
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1
        }).addTo(this.mymap);

        this.geoJsonLayer = L.geoJson(this.geoData, { style: this.style.bind(this) });
        this.geoJsonLayer.addTo(this.mymap);
    }

    updateMap() {
        this.oneNinePoverty = {};
        let singlePrjData = this.povertyData.filter(d => d['Indicator Code'] === this.state.indicator);
        _.forEach(singlePrjData, (d) => {
            this.oneNinePoverty[d['Country Code']] = d;
        });
        this.mymap.removeLayer(this.geoJsonLayer);
        this.geoJsonLayer = L.geoJson(this.geoData, { style: this.style.bind(this) });
        this.geoJsonLayer.addTo(this.mymap);
    }

    componentDidMount() {
        this.initData().then(() => this.initMap());
    }

    indicatorSelection(event) {

        this.setState(Object.assign({}, this.state, { indicator: event.currentTarget.value }));
        this.updateMap();
    }

    yearSelection(event) {
        this.setState(Object.assign({}, this.state, { selectedYear: event.currentTarget.value }));
        this.updateMap();
    }

    render() {
        return (
            <div id={this.state.id} className="component-container">
                <div className="inputs">
                    <select value={this.state.indicator} onChange={ev => this.indicatorSelection(ev)}>
                        <option value="SI.POV.GAPS">People % below $1.90/day</option>
                        <option value="SI.POV.LMIC.GP" >People % below $3.20/day</option>
                        <option value="SI.POV.UMIC.GP" >People % below $5.50/day</option>
                        <option value="EN.POP.SLUM.UR.ZS" >People % living in slums</option>
                    </select>
                    <input type='range' step="1" min="0" max={this.state.yearsCount} value={this.state.selectedYear} onChange={ev => this.yearSelection(ev)} />
                </div>
                <div className="map-container"></div>
            </div>
        )
    }
}
