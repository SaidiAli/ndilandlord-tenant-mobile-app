import React from 'react';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { ViewStyle } from 'react-native';

interface SafeAreaWrapperProps extends SafeAreaViewProps {
    backgroundColor?: string;
    style?: ViewStyle;
}

export function SafeAreaWrapper({
    children,
    backgroundColor = '#524768',
    style,
    edges = ['top'],
    ...props
}: SafeAreaWrapperProps) {
    return (
        <SafeAreaView
            style={[{ flex: 1, backgroundColor }, style]}
            edges={edges}
            {...props}
        >
            {children}
        </SafeAreaView>
    );
}
