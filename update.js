const knex = require('./config');


/* estoque = {Quantidade : req.body.Quantidade } */
const update = knex('Movimentação as m')
.join('Itens', 'm.codigoItem', 'Itens.Id')
.join('classificacao as c',  'm.codigoClassificacao', 'c.Id')
.join('CentroCusto as cc', 'm.codigoCentroCusto', 'cc.Id')
.select('m.Id', 'Quantidade', 'tipo', 'unidade', 'data',  'Itens.Id as ItemId', 'Itens.nome as nomeItem', 'c.Id as cId', 'c.nome as nomeClassificacao', 'cc.Id as CCId', 'cc.nome as CCNome')
.where('m.Id', 1)/*  knex.raw('SELECT * FROM "Movimentação"  JOIN "Itens" ON  "codigoItem" = "Itens"."Id" JOIN "CentroCusto" ON "CentroCusto"."Id" = "codigoCentroCusto" JOIN "classificacao" ON "classificacao"."Id" = "codigoClassificacao" WHERE "Movimentação"."Id" = 2')
 */
update.then(data => console.log(data))
