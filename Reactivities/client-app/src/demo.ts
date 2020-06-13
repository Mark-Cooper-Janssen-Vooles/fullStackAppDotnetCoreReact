// let data: number | string;

// data = '42';

//for simple types like a number, specifying the type is redundant 

let data = 42; 

data = 10;

//typically we'll be using objects! 
export interface ICar {
    color: string;
    model: string;
    topSpeed?: number; //? makes this optional
}

const car1: ICar = {
    color: 'blue',
    model: 'BMW'
}

const car2: ICar = {
    color: 'red',
    model: 'Mercedes',
    topSpeed: 100
}

// const multiply = (x: number, y: number): void => {
//     // return (x * y).toString();
//     y * x;
// }

export const cars = [car1, car2];