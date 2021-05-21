import React from 'react';
import Papa from 'papaparse';
import Select from 'react-select'
import { ResponsiveScatterPlotCanvas } from '@nivo/scatterplot'
import MenuList from './MenuList.js';
import MultilineOption from './MultilineOption.js'
import {
  getYRangeFromSeries,
  getMetaboliteOptions,
  communityColonizations,
  monoColonizations,
  conventionalColonizations,
  sampleTypeLabels,
} from './utils.js'


class InVivo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colonizationSelection: {
        colonization: null,
        sampleType: null,
      },
      metaboliteSelection: {
        metabolite: null,
        sampleType: null,
      },
      data: [],
      metadataCols: [],
      colonizationOptions: [],
      colonizationSampleTypeOptions: [],
      metaboliteOptions: [],
      metaboliteSampleTypeOptions: [],
    };
  }

  componentDidMount() {
    Papa.parse("mouse_metadata.txt", {
      download: true,
      complete: metadata => {
        Papa.parse("mouse_data.txt", {
          download: true,
          complete: matrix => {
            matrix = matrix.data.map((row, idx) => Object.assign({}, row, metadata.data[idx]));

            const validData = matrix.filter(
              row => row['colonization'] !== 'germ-free' && row['colonization'] !== undefined
            );

            this.setState({
              data: validData,
              colonizationOptions: this.getColonizationOptions(validData),
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

  handleColonizationSelectionChange(field, selectedValue) {
    if (field === 'colonization') {
      if (selectedValue) {
        const sampleTypes = this.state.data
          .filter(row => row['colonization'] === selectedValue['value'])
          .map(row => row['sample_type']);
        const distinctSampleTypes = [...new Set(sampleTypes)];

        this.setState({
          colonizationSelection: {
            colonization: selectedValue['value'],
            sampleType: null,
          },
          metaboliteSelection: {
            metabolite: null,
            sampleType: null,
          },
          colonizationSampleTypeOptions: distinctSampleTypes.map(
            sampleType => ({
              value: sampleType,
              label: sampleTypeLabels[sampleType] ? sampleTypeLabels[sampleType] : sampleType,
            })
          ),
        });
      } else {
        this.setState({
          colonizationSelection: {
            colonization: null,
            sampleType: null,
          },
        });
      }
    } else if (field === 'sample_type') {
      if (selectedValue) {
        this.setState({
          colonizationSelection: {
            ...this.state.colonizationSelection,
            sampleType: selectedValue['value'],
          },
        });
      } else {
        this.setState({
          colonizationSelection: {
            ...this.state.colonizationSelection,
            sampleType: null,
          },
        });
      }
    }
  }

  handleMetaboliteSelectionChange(field, selectedValue) {
    if (field === 'metabolite') {
      if (selectedValue) {
        const metabolite = selectedValue['value'];

        const sampleTypes = this.state.data
          .filter(row => row[metabolite] !== "" && row[metabolite] !== undefined)
          .map(row => row['sample_type']);

        const distinctSampleTypes = [...new Set(sampleTypes)];

        this.setState({
          metaboliteSelection: {
            metabolite: selectedValue['value'],
            sampleType: null,
          },
          colonizationSelection: {
            colonization: null,
            sampleType: null,
          },
          metaboliteSampleTypeOptions: distinctSampleTypes.map(
            sampleType => ({
              value: sampleType,
              label: sampleTypeLabels[sampleType] ? sampleTypeLabels[sampleType] : sampleType,
            })
          ),
        });
      } else {
        this.setState({
          metaboliteSelection: {
            metabolite: null,
            sampleType: null,
          },
        });
      }
    } else if (field === 'sample_type') {
      if (selectedValue) {
        this.setState({
          metaboliteSelection: {
            ...this.state.metaboliteSelection,
            sampleType: selectedValue['value'],
          },
        });
      } else {
        this.setState({
          metaboliteSelection: {
            ...this.state.metaboliteSelection,
            sampleType: null,
          },
        });
      }
    }
  }

  getColonizationOptions(data) {
    const colonizations = data.map(row => row['colonization']);
    const distinctColonizations = [...new Set(colonizations)];

    const colonizationGroups = {
      community: [],
      mono: [],
      conventional: [],
    };

    for (let i in distinctColonizations) {
      const colonization = distinctColonizations[i];

      if (communityColonizations[colonization]) {
        colonizationGroups.community.push({
          value: colonization,
          label: communityColonizations[colonization].label,
          description: communityColonizations[colonization].description
        });
      } else if (conventionalColonizations[colonization]) {
        colonizationGroups.conventional.push({
          value: colonization,
          label: conventionalColonizations[colonization].label,
        });
      } else {
        colonizationGroups.mono.push({
          value: colonization,
          label: monoColonizations[colonization].label,
          description: monoColonizations[colonization].description
        });
      }
    }

    return [
      {
        label: 'Defined Community',
        options: colonizationGroups.community,
      },
      {
        label: 'Mono-colonization',
        options: colonizationGroups.mono,
      },
      {
        label: 'Conventional',
        options: colonizationGroups.conventional,
      }
    ];
  }

  getPlotData() {
    if (this.state.colonizationSelection.sampleType !== null) {
      // Find the replicates matching the current selection
      const rows = this.state.data
        .filter(row => row['colonization'] === this.state.colonizationSelection.colonization
          && row['sample_type'] === this.state.colonizationSelection.sampleType
          )

      let data = [];

      for (let idx in rows) {
        const row = rows[idx];

        for (let metabolite in row) {
          if (this.state.metadataCols.includes(metabolite) ||
              metabolite.startsWith('IS_')) {
            continue;
          }

          const y = Number(row[metabolite]);

          if (y === 0) {
            continue;
          }

          data.push({name: metabolite, y: y});
        }
      }

      const allNames = [...new Set(data.map(dataPoint => dataPoint.name))]
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

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
    } else if (this.state.metaboliteSelection.sampleType !== null) {
      const sampleTypeRows = this.state.data
        .filter(row => row['sample_type'] === this.state.metaboliteSelection.sampleType);

      let data = [];

      for (let idx in sampleTypeRows) {
        const currentSampleTypeRow = sampleTypeRows[idx];
        const y = currentSampleTypeRow[this.state.metaboliteSelection.metabolite]

        if (y === "" || y === undefined) {
          continue;
        }

        data.push({name: currentSampleTypeRow['colonization'], y: y});
      }

      const allNames = [...new Set(data.map(dataPoint => dataPoint.name))]
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

      const xValueIndices = {};

      for (let [key, value] of Object.entries(allNames)) {
        xValueIndices[value] = Number(key);
      }

      const getPrettyName = name => communityColonizations[name]
        ? communityColonizations[name].label
        : monoColonizations[name]
          ? monoColonizations[name].label
          : conventionalColonizations[name].label;

      data = data.map(dataPoint => ({
        x: xValueIndices[dataPoint.name],
        y: dataPoint.y,
        name: getPrettyName(dataPoint.name)
      }));

      return {
        plotData: [
          {
            id: 'all',
            data: data,
          },
        ],
        allNames: allNames.map(getPrettyName),
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

    const allColonizations = Object.assign(
      {},
      communityColonizations,
      monoColonizations,
      conventionalColonizations
    );

    return (
      <div className="App">
        <p>
          This page enables plotting <em>in vivo</em> data from Han and Van Treuren <em>et al</em>.
        </p>

        <p>
          Select a <strong>Colonization</strong> and <strong>Sample Type</strong> below
          to plot the relative fold change across all metabolites.
        </p>

        <p>
          Alternatively, select a <strong>Metabolite</strong> and <strong>Sample Type</strong> below
          to plot the relative fold change across all colonizations.
        </p>

        <form className="form">
          <div className="form-group">
            <label htmlFor="colonization">Gnotobiotic Mice Colonization</label>
            <Select id="colonization"
              className="dropdown"
              components={{ Option: MultilineOption }}
              isClearable={true}
              options = {this.state.colonizationOptions}
              onChange = {val => this.handleColonizationSelectionChange('colonization', val)}
              styles={{ option: (provided, state) => ({ ...provided, whiteSpace: 'pre-wrap' }) }}
              value={this.state.colonizationSelection.colonization
                ? {
                  ...allColonizations[this.state.colonizationSelection.colonization],
                  value: this.state.colonizationSelection.colonization,
                } : null}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sample_type">Sample Type</label>
            <Select id="sample_type"
              className="dropdown"
              isClearable={true}
              isDisabled={this.state.colonizationSelection.colonization === null}
              options={this.state.colonizationSampleTypeOptions}
              onChange = {val => this.handleColonizationSelectionChange('sample_type', val)}
              value={
                this.state.colonizationSampleTypeOptions
                  .find(sampleType => sampleType.value === this.state.colonizationSelection.sampleType) || null
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
            <label htmlFor="sample_type">Sample Type</label>
            <Select id="sample_type"
              className="dropdown"
              isClearable={true}
              isDisabled={this.state.metaboliteSelection.metabolite === null}
              options = {this.state.metaboliteSampleTypeOptions}
              onChange = {val => this.handleMetaboliteSelectionChange('sample_type', val)}
              value={
                this.state.metaboliteSampleTypeOptions
                  .find(sampleType => sampleType.value === this.state.metaboliteSelection.sampleType) || null
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
                        <strong>{this.state.metaboliteSelection.metabolite ? 'colonization' : 'metabolite'}</strong>
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
                  legend: this.state.metaboliteSelection.metabolite ? 'Colonization' : 'Metabolite',
                  legendPosition: 'middle',
                  legendOffset: this.state.metaboliteSelection.metabolite ? 130 : 700
                }}
                axisLeft={{
                  orient: 'left',
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Relative fold change versus germ-free controls (log2)',
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

export default InVivo
