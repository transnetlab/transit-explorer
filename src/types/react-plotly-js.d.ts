declare module 'react-plotly.js' {
  import * as React from 'react';
  const Plot: React.ComponentType<{ data: any; layout?: any; config?: any; style?: React.CSSProperties }>;
  export default Plot;
}
