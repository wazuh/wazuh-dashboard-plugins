import { getArchitectureStepContent, getDeployAgentSteps, getOSStepContent, getVersionStepContent, iButtonContent, renderContent } from './deploy-agent-steps'

describe('Deploy agent steps', () => {

    describe('getDeployAgentSteps', () => {
        it('should return first step when os,version,architecture is not defined', () => {
            const state = {
                OSSelected: '',
                OSVersionSelected: '',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSArchSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(JSON.stringify(steps)).toEqual(JSON.stringify([
                {
                    title: 'Choose the operating system',
                    children: renderContent({...getOSStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)})
                }
            ]))
        })

        it('should return version steps when os is defined and version,architecture is not defined', () => {
            const state = {
                OSSelected: 'aix',
                OSVersionSelected: '',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(JSON.stringify(steps)).toEqual(JSON.stringify([
                {
                    title: 'Choose the operating system',
                    children: renderContent({...getOSStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)})
                },
                {
                    title: 'Choose the version',
                    children: renderContent({...getVersionStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)} as iButtonContent)
                }
            ]))
        })

        it('should return all steps when os,version is defined and architecture is not defined', () => {
            const state = {
                OSSelected: 'aix',
                OSVersionSelected: '6.1 TL9',
                OSArchSelected: ''
            }
            const steps = getDeployAgentSteps(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)
            expect(JSON.stringify(steps)).toEqual(JSON.stringify([
                {
                    title: 'Choose the operating system',
                    children: renderContent({...getOSStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)})
                },
                {
                    title: 'Choose the version',
                    children: renderContent({...getVersionStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)} as iButtonContent)
                },
                {
                    title: 'Choose the architecture',
                    children: renderContent({...getArchitectureStepContent(state.OSSelected, state.OSVersionSelected, state.OSArchSelected)} as iButtonContent)
                }
            ]))
        })
    })
    
})