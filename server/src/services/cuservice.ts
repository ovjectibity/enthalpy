interface ComputerUseService {
    getScreenshot(): string;
    performLeftClick(x: number,y: number): string;
    performRightClick(x: number,y: number): string; 
    performScroll(x: number,y: number): string;
    performKeyInput(input: string): string;
}

class CUConnector implements ComputerUseService {
    constructor() {

    }

    getScreenshot(): string {
        
    }

    performLeftClick(x: number,y: number): string {

    }

    performRightClick(x: number,y: number): string {

    }

    performScroll(x: number,y: number): string {

    }

    performKeyInput(input: string): string {

    }
}

export { ComputerUseService };