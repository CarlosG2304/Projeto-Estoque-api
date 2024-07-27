const knex = require('./config');


 const select = knex('Saldo').select('codigoItem ','Valor_unitario')
async function  update(codigoItem, valor_unitario){
    item ={
        "valorUnitario": valor_unitario
    }    
const update = await knex('Movimentação')
.update(item)
.where('codigoItem',codigoItem)
.whereNull('CodigoSaldo')

console.log(update)
}
select.then(dados => {
    for(let itemb of dados){
        update(itemb.codigoItem, itemb.Valor_unitario)
  
}
  
})  



/* const select = knex('Movimentação').select('valorUnitario')
  .where('codigoItem', 237)
  .where('tipo','ENTRADA')

  select.then(dados => {
 
  console.log(dados)
  
})
 */

/*    const select = knex('Movimentação as m').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
  .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
  .where('tipo','SAIDA')
  .whereNotNull('valorUnitario')
  .whereBetween('m.data', ['2024-06-01','2024-07-30'])
  .groupBy('I.nome')
  select.then(dados => {
 
  console.log(dados)
  
}) 
 */