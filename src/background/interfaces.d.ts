interface positionRule {
   start?: {
      line: number,
      column: number
   },
   end?: {
      line: number,
      column: number
   }
   source: string
}

interface declarationRule {
   property: string
   value: string
   position: positionRule
}

interface cssRule {
   index: number
   media: {
      media: string
      queries: QueryObj[]
      position: positionRule
   }
   selector: string
   position: positionRule
   declarations: declarationRule[]
   date?: string
   author?: {
      userId: string
      name: string
   }
}

interface RuleObj {
    index: number
    selector: string
    cssRule: cssRule
    specificity: number[],
    inheritance: HTMLElement[]
}

interface QueryObj{
   width:{
      min: number,
      max: number
   },
   height:{
      min: number,
      max: number
   }
}

interface PropertyObj {
    property: string
    value: string
    position: positionRule
    selector: {
        selector: string
        position: positionRule
    }
    media: {
        media: string
        queries: QueryObj[]
        position: positionRule
    }
}

interface FinalObj {
    selectors: {
        selectors: string[]
        position: positionRule
    }
    value: string
    valuePosition: positionRule
    media: {
        media: string
        queries: QueryObj[]
        position: positionRule
    }
}
