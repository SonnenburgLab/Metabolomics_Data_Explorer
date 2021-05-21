import React from 'react';
import { FixedSizeList } from 'react-window';

const MenuList = props => {
  const rows = props.children;

  return (
    <FixedSizeList
      height={300}
      itemSize={30}
      itemCount={rows.length}
    >
      {({ index, isScrolling, style }) => (
        <div style={{...style, whiteSpace: 'nowrap'}}>{rows[index]}</div>
      )}
    </FixedSizeList>
  );
}

export default MenuList;
