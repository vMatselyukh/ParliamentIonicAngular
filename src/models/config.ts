import { Person } from './models';

export class Config {
    Persons: Person[];
    Md5Hash: string;

    constructor() {
        this.Persons = [];
    }
}