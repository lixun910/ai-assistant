import React from 'react';

const Icon = ({ icon, ...props }: { icon: string }) =>
  React.createElement('svg', {
    'data-icon': icon,
    ...props,
  });

export default Icon;
