export class ProposeQuote {
    constructor(public quote: string,
        public userGuid: string,
        public politicianName?: string,
        public url?: string) {
    }
}