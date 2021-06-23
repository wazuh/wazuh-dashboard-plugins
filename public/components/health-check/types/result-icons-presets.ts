export type ResultIconProps = {
    tooltipText?: string
    iconColor?: string
    iconType?: string
    disabled?: boolean
    spinner?: boolean
    retry?: boolean
};

export type ResultIconsPreset = {
    disabled: ResultIconProps,
    loading: ResultIconProps,
    ready: ResultIconProps,
    error: ResultIconProps,
    error_retry: ResultIconProps,
    waiting: ResultIconProps
};

export const resultsPreset: ResultIconsPreset = {
    disabled: {
        disabled: true
    },
    loading: {
        tooltipText: 'Checking...',
        spinner: true,
        iconType: ''
    },
    ready: {
        tooltipText: 'Ready',
        iconColor: 'secondary',
        iconType: 'check'
    },
    error: {
        tooltipText: 'Error',
        iconColor: 'danger',
        iconType: 'alert'
    },
    error_retry: {
        tooltipText: 'Error',
        iconColor: 'danger',
        iconType: 'alert',
        retry: true
    },
    waiting: {
        tooltipText: 'On hold...',
        iconColor: '#999999',
        iconType: 'clock'
    }
}