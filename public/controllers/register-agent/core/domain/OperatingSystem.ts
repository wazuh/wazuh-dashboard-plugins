import { tOS, tPackageExtensions } from "../register-commands/types";

export interface IOperationSystem {
    name: tOS;
    architecture: string;
    extension: tPackageExtensions;
}