import { getArchitectureStepContent, getDeployAgentSteps, getOSSteṕContent, getVersionStepContent } from './deploy-agent-steps'

describe('Deploy agent steps', () => {

    describe('getDeployAgentSteps', () => {
        it('should return first step when os,version,architecture is not defined', () => {
            const state = {
                OSSelected: '',
                OSVersionSelected: '',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSArchSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(steps).toEqual([
                {
                    title: 'Choose the operating system',
                    children: getOSSteṕContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                }
            ])
        })

        it('should return version steps when os is defined and version,architecture is not defined', () => {
            const state = {
                OSSelected: 'aix',
                OSVersionSelected: '',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(steps).toEqual([
                {
                    title: 'Choose the operating system',
                    children: getOSSteṕContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                },
                {
                    title: 'Choose the version',
                    children: getVersionStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                }
            ])
        })

        it('should return all steps when os,version is defined and architecture is not defined', () => {
            const state = {
                OSSelected: 'aix',
                OSVersionSelected: '6.1 TL9',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(steps).toEqual([
                {
                    title: 'Choose the operating system',
                    children: getOSSteṕContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                },
                {
                    title: 'Choose the version',
                    children: getVersionStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                },
                {
                    title: 'Choose the architecture',
                    children: getArchitectureStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
                }
            ])
        })
    })
    
})