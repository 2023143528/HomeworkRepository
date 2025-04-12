let amount;
let principal = 1000;
let rate = 0.03;

for (let i=1, i <= 10, i++) {
    let new_amount = 0
    new_amount = principal * Math.pow( 1 + rate, year )
    document.writeln(new_amount)
}