import React from 'react';
import { components } from 'react-select';

const MultilineOption = props => {
  const { innerProps } = props;

  return (
    <components.Option {...props}>
      <div>{props.label}</div>
      {props.data.description ? (
        <div className="option-byline">{props.data.description}</div>
      ) : null}
    </components.Option>
  );
}

export default MultilineOption;
