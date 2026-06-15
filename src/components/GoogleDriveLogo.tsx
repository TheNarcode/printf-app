import React from 'react';
import {CloudUpload} from 'lucide-react-native';

interface Props {
  size?: number;
  color?: string;
}

export default function GoogleDriveLogo({size = 18, color = '#71717A'}: Props) {
  return <CloudUpload size={size} color={color} strokeWidth={2} />;
}
