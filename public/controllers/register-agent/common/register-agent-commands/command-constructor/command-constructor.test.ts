import { RegisterAgentCommandConstructor } from './command-constructor'
import { defaultPackageDefinitions } from '../definitions';

describe('Register Agent Command Generator', () => {
   it('should return an instance of RegisterAgentCommandConstructor', () => {
        const registerAgentCommandConstructor = new RegisterAgentCommandConstructor(
             defaultPackageDefinitions
        )
        expect(registerAgentCommandConstructor).toBeInstanceOf(RegisterAgentCommandConstructor)
   })

})