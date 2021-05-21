import React from 'react';
import Papa from 'papaparse';
import Select from 'react-select'
import { ResponsiveScatterPlotCanvas } from '@nivo/scatterplot'
import MenuList from './MenuList.js';
import MultilineOption from './MultilineOption.js'
import {
  getYRangeFromSeries,
  getMetaboliteOptions,
  caseInsensitiveStringCmp,
  compareMediaLabels,
  mediaLabels,
} from './utils.js'

class InVitro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      taxonomySelection: {
        taxonomy: null,
        media: null,
      },
      metaboliteSelection: {
        metabolite: null,
        media: null,
      },
      data: [],
      metadataCols: [],
      taxonomyOptions: [],
      taxonomyMediaOptions: [],
      metaboliteOptions: [],
      metaboliteMediaOptions: [],
    };
  }

  componentDidMount() {
    Papa.parse("in_vitro_metadata.txt", {
      download: true,
      complete: metadata => {
        Papa.parse("in_vitro_data.txt", {
          download: true,
          complete: matrix => {
            matrix = matrix.data.map((row, idx) => Object.assign({}, row, metadata.data[idx]));

            const validData = matrix.filter(
              row => row['sample_type'] === 'supernatant'
            );

            this.setState({
              data: validData,
              taxonomyOptions: this.getTaxonomyOptions(validData),
              metaboliteOptions: getMetaboliteOptions(validData, metadata.meta.fields),
              metadataCols: metadata.meta.fields,
            });
          },
          header: true,
        });

      },
      header: true,
    });
  }

  handleTaxonomySelectionChange(field, selectedValue) {
    if (field === 'taxonomy') {
      if (selectedValue) {
        const medias = this.state.data
          .filter(row => row['taxonomy'] === selectedValue['value'])
          .map(row => row['media']);
        const distinctMedias = [...new Set(medias)];

        this.setState({
          taxonomySelection: {
            taxonomy: selectedValue['value'],
            media: null,
          },
          metaboliteSelection: {
            metabolite: null,
            media: null,
            mode: null,
          },
          taxonomyMediaOptions: distinctMedias.map(
            media => ({
              value: media,
              label: mediaLabels[media] ? mediaLabels[media] : media,
            })
          ),
        });
      } else {
        this.setState({
          taxonomySelection: {
            taxonomy: null,
            media: null,
          },
        });
      }
    } else if (field === 'media') {
      this.setState({
        taxonomySelection: {
          taxonomy: this.state.taxonomySelection.taxonomy,
          media: selectedValue ? selectedValue['value'] : null,
        },
      });
    }
  }

  handleMetaboliteSelectionChange(field, selectedValue) {
    if (field === 'metabolite') {
      if (selectedValue) {
        const metabolite = selectedValue['value'];

        const medias = this.state.data
          .filter(row => row[metabolite] !== "" && row[metabolite] !== undefined)
          .map(row => row['media']);

        const distinctMedias = [...new Set(medias)];

        this.setState({
          metaboliteSelection: {
            metabolite: selectedValue['value'],
            media: null,
          },
          taxonomySelection: {
            taxonomy: null,
            media: null,
          },
          metaboliteMediaOptions: distinctMedias.map(
            media => ({
              value: media,
              label: mediaLabels[media] ? mediaLabels[media] : media,
            })
          ),
        });
      } else {
        this.setState({
          metaboliteSelection: {
            metabolite: null,
            media: null,
          },
        });
      }
    } else if (field === 'media') {
      this.setState({
        metaboliteSelection: {
          metabolite: this.state.metaboliteSelection.metabolite,
          media: selectedValue ? selectedValue['value'] : null,
        },
      });
    }
  }

  getTaxonomyOptions(data) {
    const taxonomies = data.map(row => row['taxonomy']);
    const distinctTaxonomies = [...new Set(taxonomies)]
      .sort(caseInsensitiveStringCmp);

    return distinctTaxonomies.map(taxonomy => ({value: taxonomy, label: taxonomy}));
  }

  getPlotData() {
    if (this.state.taxonomySelection.media !== null) {
      const rows = this.state.data
        .filter(row => row['taxonomy'] === this.state.taxonomySelection.taxonomy
          && row['media'] === this.state.taxonomySelection.media
        )

      let data = [];

      for (let idx in rows) {
        const row = rows[idx];

        for (let metabolite in row) {
          if (this.state.metadataCols.includes(metabolite) ||
              metabolite.startsWith('IS_')) {
            continue;
          }

          let y = Number(row[metabolite]);

          if (y === 0) {
            continue;
          }

          data.push({name: metabolite, y: y});
        }
      }

      const allNames = [...new Set(data.map(dataPoint => dataPoint.name))]
        .sort(caseInsensitiveStringCmp);

      const xValueIndices = {};

      for (let [key, value] of Object.entries(allNames)) {
        xValueIndices[value] = Number(key);
      }

      data = data.map(dataPoint => ({
        x: xValueIndices[dataPoint.name],
        y: dataPoint.y,
        name: dataPoint.name
      }));

      return {
        plotData: [
          {
            id: 'all',
            data: data,
          },
        ],
        allNames: allNames,
        yRange: getYRangeFromSeries([data]),
      };
    } else if (this.state.metaboliteSelection.media !== null) {
      const mediaRows = this.state.data
        .filter(row => row['media'] === this.state.metaboliteSelection.media);

      let data = [];

      for (let idx in mediaRows) {
        const currentMediaRow = mediaRows[idx];
        const y = currentMediaRow[this.state.metaboliteSelection.metabolite]

        if (y === "" || y === undefined) {
          continue;
        }

        data.push({ name: currentMediaRow['taxonomy'], y: Number(y) });
      }

      const allNames = [...new Set(data.map(dataPoint => dataPoint.name))]
        .sort(caseInsensitiveStringCmp);

      const xValueIndices = {};

      for (let [key, value] of Object.entries(allNames)) {
        xValueIndices[value] = Number(key);
      }

      data = data.map(dataPoint => ({
        x: xValueIndices[dataPoint.name],
        y: dataPoint.y,
        name: dataPoint.name
      }));

      return {
        plotData: [
          {
            id: 'all',
            data: data,
          },
        ],
        allNames: allNames,
        yRange: getYRangeFromSeries([data]),
      };
    } else {
      return {
        plotData: [],
        allNames: {},
        yRange: [0, 0],
      };
    }
  }

  render() {
    const { plotData, allNames, yRange } = this.getPlotData();

    const MIN_PLOT_WIDTH = 300;
    const plotMinWidth = Math.max(MIN_PLOT_WIDTH, 11 * (Object.keys(allNames)).length + 100);

    return (
      <div className="App">
        <p>
          This page enables plotting <em>in vitro</em> data from Han and Van Treuren <em>et al</em>.
        </p>

        <p>
          Select a <strong>Taxonomy</strong> and <strong>Media</strong> below to plot the relative fold
          change across all metabolites.
        </p>

        <p>
          Alternatively, select a <strong>Metabolite</strong> and <strong>Media</strong> below to plot the relative fold
          change across all taxonomies.
        </p>

        <form className="form">
          <div className="form-group">
            <label htmlFor="taxonomy">Taxonomy</label>
            <Select id="taxonomy"
              className="dropdown"
              components={{ MenuList }}
              isClearable={true}
              options = {this.state.taxonomyOptions}
              onChange = {val => this.handleTaxonomySelectionChange('taxonomy', val)}
              value={
                this.state.taxonomyOptions
                  .find(taxonomy => taxonomy.value === this.state.taxonomySelection.taxonomy) || null
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="media">Media</label>
            <Select id="media"
              className="dropdown"
              isClearable={true}
              isDisabled={this.state.taxonomySelection.taxonomy === null}
              options={this.state.taxonomyMediaOptions.sort(compareMediaLabels)}
              onChange = {val => this.handleTaxonomySelectionChange('media', val)}
              value={
                this.state.taxonomyMediaOptions
                  .find(media => media.value === this.state.taxonomySelection.media) || null
              }
            />
          </div>
        </form>

        <form className="form">
          <div className="form-group">
            <label htmlFor="metabolite">Metabolite</label>
            <Select id="metabolite"
              className="dropdown"
              components={{ MenuList }}
              isClearable={true}
              options = {this.state.metaboliteOptions}
              onChange = {val => this.handleMetaboliteSelectionChange('metabolite', val)}
              value={
                this.state.metaboliteOptions
                  .find(metabolite => metabolite.value === this.state.metaboliteSelection.metabolite) || null
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="media">Media</label>
            <Select id="media"
              className="dropdown"
              isClearable={true}
              isDisabled={this.state.metaboliteSelection.metabolite === null}
              options={this.state.metaboliteMediaOptions.sort(compareMediaLabels)}
              onChange={val => this.handleMetaboliteSelectionChange('media', val)}
              value={
                this.state.metaboliteMediaOptions
                  .find(media => media.value === this.state.metaboliteSelection.media) || null
              }
            />
          </div>
        </form>

        {plotData.length > 0 ? (
          <div style={{width: '100%', overflowX: 'scroll', overflowY: 'hidden'}}>
            <div style={{
              minWidth: plotMinWidth + 'px',
              width: plotMinWidth < 500 ? (plotMinWidth + 'px') : null,
              height: '1100px'
            }}>
              <ResponsiveScatterPlotCanvas
                tooltip={({ node }) => {
                  return (
                    <div
                      style={{
                        background: '#fff',
                        border: '1px solid #ccc',
                        color: node.style.color,
                        fontSize: '12px',
                        padding: '6px 6px',
                      }}
                    >
                      <div style={{maxWidth: '400px', wordWrap: 'break-word'}}>
                        <strong>{this.state.metaboliteSelection.metabolite ? 'taxonomy' : 'metabolite'}</strong>
                        : {node.data.name}
                      </div>
                      <div><strong>y</strong>: {node.data.formattedY}</div>
                    </div>
                    );
                }}
                data={plotData}
                colors={{ scheme: 'category10' }}
                theme={{fontSize: 10}}
                pixelRatio={2}
                margin={{ top: 80, right: 20, bottom: 740, left: 90 }}
                xScale={{ type: 'linear', min: 0, max: 'auto' }}
                yScale={{ type: 'linear', min: yRange[0], max: yRange[1] }}
                nodeSize={4}
                gridXValues={Object.keys(allNames)}
                axisBottom={{
                  format: d => {
                    return allNames[d];
                  },
                  orient: 'bottom',
                  tickValues: Object.keys(allNames),
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -90,
                  legend: this.state.metaboliteSelection.metabolite ? 'Taxonomy' : 'Metabolite',
                  legendPosition: 'middle',
                  legendOffset: this.state.metaboliteSelection.metabolite ? 300 : 700
                }}
                axisLeft={{
                  orient: 'left',
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Relative fold change versus media blank controls (log2)',
                  legendPosition: 'middle',
                  legendOffset: -60
                }}
              />
            </div>
          </div>
        ) : null}

        {plotData.length == 0 ? (
          <footer>
            <p>About the Website:
              The Metabolomics Data Explorer was designed by Shuo Han.
              © The Sonnenburg Lab 2020, Stanford University
            </p>
          </footer>
        ) : null}
      </div>
    );
  }
}

export default InVitro;
