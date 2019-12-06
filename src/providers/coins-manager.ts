import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { DbContext } from './db-context';

@Injectable()
export class CoinsManager {
    readonly configKey: string = "Config";
    readonly coinsKey: string = "Coins";

    constructor(private dbContext: DbContext) {
    }
}