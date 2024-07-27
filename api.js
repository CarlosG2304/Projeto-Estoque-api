
const knex = require('./config');
const express = require('express');
const app = express()
var cors = require('cors')
const bodyParser = require('body-parser')
const port = 3001
var pdfMake = require('pdfmake/build/pdfmake.js');
var pdfFonts = require('pdfmake/build/vfs_fonts.js');
var PdfPrinter = require('pdfmake');
app.use(bodyParser.json())

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))

app.get('/movimentacao', (req,res) => {
  
  const select = knex('Movimentação as m')
  .join('Itens as I', 'm.codigoItem', 'I.Id')
  .leftJoin('classificacao as c',  'm.codigoClassificacao', 'c.Id')
  .leftJoin('CentroCusto as cc', 'm.codigoCentroCusto', 'cc.Id')
  .select('m.Id','m.Quantidade','m.tipo','m.unidade','m.data','I.nome','c.nome as classificacao','cc.nome as centrocusto' )
   .whereILike('I.nome', '%'+req.query.filtro+'%') 
   .whereBetween('data', [req.query.dataInicio,req.query.dataFim])
  .orderBy('data', 'desc')

  select.then(data => {
       res.send(data)
  })

})

app.get('/movimentacao/relatorio',async(req,res) => {

  const select = await knex('Movimentação as m')
  .join('Itens', 'm.codigoItem', 'Itens.Id')
  .leftJoin('classificacao as c',  'm.codigoClassificacao', 'c.Id')
  .leftJoin('CentroCusto as cc', 'm.codigoCentroCusto', 'cc.Id')
  .select('m.Id', 'Quantidade', 'tipo', 'unidade', 'data',  'Itens.Id as ItemId', 'Itens.nome as nomeItem', 'c.Id as cId', 'c.nome as nomeClassificacao', 'cc.Id as CCId', 'cc.nome as CCNome')
  .whereBetween('data', [req.query.dataInicio,req.query.dataFim])
  .orderBy('data')
 
  var fonts = {
     Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique'
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  },
  Symbol: {
    normal: 'Symbol'
  },
  ZapfDingbats: {
    normal: 'ZapfDingbats'
  }
    };

    console.log(req.query.dataInicio)
    body = []
    for(let movimentacacao of select){
      rows = []
      rows.push(movimentacacao.nomeItem)
      rows.push(movimentacacao.tipo)
      rows.push((movimentacacao.data.getDate() ) + "/" + (movimentacacao.data.getMonth() + 1) + "/" + movimentacacao.data.getFullYear() )
      rows.push(movimentacacao.CCNome)
      rows.push(movimentacacao.nomeClassificacao)
      rows.push(movimentacacao.unidade)
      rows.push(movimentacacao.Quantidade)
      body.push(rows) 
    
    }
    var docDefinition = {
      content: [{
        text:['Relatorio da movimentação de estoque\n\n', 'Periodo: '+req.query.dataInicio+' - '+req.query.dataFim], style:'header',
      },
       { table: {
        widths: ['auto', 55, 50,'auto','auto','auto','auto'],
    
        body: [
          [{text: "Descrição", style: 'columnsTitle'}, {text: "Tipo" , style: 'columnsTitle'},{text:"Data", style: 'columnsTitle'} ,{text: "Centro de Custo", style: 'columnsTitle'}, {text: "Classificação", style: 'columnsTitle'}, {text: "Unidade", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'}],
          ...body
      
      ]
       },
       alignment: "left",
       layout: {hLineWidth: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 2 : 1;
      },
      vLineWidth: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 2 : 0;
      },
      hLineColor: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
      },
      vLineColor: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
      },}
    }
      ],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 11,
      
      },
      styles: {
        header: {
          font:'Courier',
          fontSize: 16,
          bold: true,
          alignment: "center",
          color:'gray'
      
      
        },
        columnsTitle: {
          fontSize: 13,
          bold: true,
          fillColor:"gray",
          color:'#fff',
          alignment:'center'
        
         }

      }
    };
  const printer =  new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks = []
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk)
  })
pdfDoc.end();
  pdfDoc.on("end", () => {
    const result = Buffer.concat(chunks)
    res.end(result)
  })
  
})

app.get('/movimentacao/relatorio/resumo',async(req,res) => {

  const select = await knex('Movimentação as m')
  .join('Itens', 'm.codigoItem', 'Itens.Id')
  .leftJoin('classificacao as c',  'm.codigoClassificacao', 'c.Id')
  .leftJoin('CentroCusto as cc', 'm.codigoCentroCusto', 'cc.Id')
  .select('tipo', 'Itens.nome as nomeItem', 'c.nome as nomeClassificacao', 'cc.nome as CCNome')
  .sum('Quantidade as Quantidade')
  .groupBy('nomeItem')
  .groupBy('tipo')
  .groupBy('cc.nome')
  .groupBy('nomeClassificacao')
  .whereBetween('data', [req.query.dataInicio,req.query.dataFim])
  .orderBy('CCNome')
 
  var fonts = {
     Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique'
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  },
  Symbol: {
    normal: 'Symbol'
  },
  ZapfDingbats: {
    normal: 'ZapfDingbats'
  }
    };

    body = []
    for(let movimentacacao of select){
      rows = []
      rows.push(movimentacacao.nomeItem)
      rows.push(movimentacacao.tipo)
      rows.push(movimentacacao.CCNome)
      rows.push(movimentacacao.nomeClassificacao)
     /*  rows.push(movimentacacao.unidade) */
      rows.push(movimentacacao.Quantidade)
      body.push(rows) 
    }
    var docDefinition = {
      content: [{
        text:['Relatorio da movimentação de estoque resumido\n\n','Periodo: '+req.query.dataInicio+' - '+req.query.dataFim], style:'header',
      },
       { table: {
        widths: ['auto','auto','auto','auto','auto'],
    
        body: [
          [{text: "Descrição", style: 'columnsTitle'}, {text: "Tipo" , style: 'columnsTitle'} ,{text: "Centro de Custo", style: 'columnsTitle'}, {text: "Classificação", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'}],
          ...body
      
      ]
       },
       alignment: "left",
       layout: {hLineWidth: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 2 : 1;
      },
      vLineWidth: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 2 : 0;
      },
      hLineColor: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
      },
      vLineColor: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
      },}
    }
      ],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 11,
      
      },
      styles: {
        header: {
          font:'Courier',
          fontSize: 16,
          bold: true,
          alignment: "center",
          color:'gray'
      
      
        },
        columnsTitle: {
          fontSize: 13,
          bold: true,
          fillColor:"gray",
          color:'#fff',
          alignment:'center'
        
         }

      }
    };
  const printer =  new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks = []
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk)
  })
pdfDoc.end();
  pdfDoc.on("end", () => {
    const result = Buffer.concat(chunks)
    res.end(result)
  })
  
})

app.get('/movimentacao/:id', (req,res) => {
  
  const select = knex('Movimentação as m')
  .join('Itens', 'm.codigoItem', 'Itens.Id')
  .fullOuterJoin('classificacao as c',  'm.codigoClassificacao', 'c.Id')
  .fullOuterJoin('CentroCusto as cc', 'm.codigoCentroCusto', 'cc.Id')
  .select('m.Id', 'Quantidade','m.valorUnitario', 'tipo', 'unidade', 'data',  'Itens.Id as ItemId', 'Itens.nome as nomeItem', 'c.Id as cId', 'c.nome as nomeClassificacao', 'cc.Id as CCId', 'cc.nome as CCNome', 'observacao')
  .where('m.Id', req.params.id)
  
  select.then(data => {

    movimentacacao = {
      "Id": data[0].Id,
      "data": data[0].data,
      "Quantidade": data[0].Quantidade,
      "unidade": data[0].unidade,
      "tipo": data[0].tipo,
      "item": {
        "Id": data[0].ItemId,
        "nome": data[0].nomeItem
      },
      "centrocusto": {
        "Id": data[0].CCId,
        "nome": data[0].CCNome},
     "classificacao": {
        "Id":  data[0].cId,
        "nome":data[0].nomeClassificacao},
        "valorUnitario":data[0].valorUnitario,
    "observacao":data[0].observacao
    }

       res.send(movimentacacao)
       
  }).catch(error => res.status(500).send(error))

})

app.post('/movimentacao', (req,res) => {
  if(req.body.centrocusto){
  movimentacacao = {
    "Quantidade": req.body.Quantidade,
    "tipo":  req.body.tipo,
    "unidade": req.body.unidade,
    "data": req.body.data,
    "codigoItem": req.body.item.Id,
    "valorUnitario": parseFloat(req.body.valorUnitario.replace(',','.')),
    "codigoCentroCusto":  req.body.centrocusto.Id,
    "codigoClassificacao": req.body.classificacao.Id,
    "observacao":req.body.observacao
  }
 
  }else{
    movimentacacao = {
      "Quantidade": req.body.Quantidade,
      "tipo":  req.body.tipo,
      "unidade": req.body.unidade,
      "data": req.body.data,
      "codigoItem": req.body.item.Id,
      "valorUnitario": parseFloat(req.body.valorUnitario.replace(',','.')),
    }
  
  }

  const insert =  knex('Movimentação').insert(movimentacacao)
  
  
  insert.then(data => {
    res.send(data)
})
.catch(error =>{res.status(500).send(error)
  console.log(error)}
)

  
   
 
})

app.put('/movimentacao', (req,res) => {
  
  if(req.body.centrocusto){
    movimentacacao = {
      "tipo":  req.body.tipo,
      "unidade": req.body.unidade,
      "data": req.body.data,
      "codigoItem": req.body.item.Id,
      "Quantidade": req.body.Quantidade,
      "valorUnitario": parseFloat(req.body.valorUnitario.replace(',','.')),
      "codigoCentroCusto":  req.body.centrocusto.Id,
      "codigoClassificacao": req.body.classificacao.Id,
      "observacao":req.body.observacao
      
    }
    }else{
      movimentacacao = {
        "Quantidade": req.body.Quantidade,
        "tipo":  req.body.tipo,
        "unidade": req.body.unidade,
        "data": req.body.data,
        "codigoItem": req.body.item.Id,
        "valorUnitario": parseFloat(req.body.valorUnitario.replace(',','.'))
      }
    }
  

    const update = knex('Movimentação')
    .update(movimentacacao)
    .where('Id', req.body.Id)
  
    update.then(data => {
         res.send({Resposta: data})
    })
    .catch(error => {
      console.log(error)
      res.sendStatus(500)

    })
     
})

app.get('/saldo', (req,res) => {
  
  if(req.query.tipo == 'SAIDA'){
    const select = knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
    .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
    .where('tipo','SAIDA')
    .whereNotNull('valorUnitario')
    .whereNot('valorUnitario',0)
    .whereBetween('m.data', [req.query.dataInicio,req.query.dataFim])
    .whereILike('I.nome', '%'+req.query.filtro+'%') 
    .groupBy('I.nome')
  select.then(data => {
       res.send(data)
  })  
} else if(req.query.tipo == 'ENTRADA'){
  const select = knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
  .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
  .where('tipo','ENTRADA')
  .whereNotNull('valorUnitario')
  .whereBetween('m.data', [req.query.dataInicio,req.query.dataFim])
  .whereILike('I.nome', '%'+req.query.filtro+'%') 
  .groupBy('I.nome')
  select.then(data => {
       res.send(data)
  })
}

})
app.get('/saldo/relatorio', async(req,res) => {
  
  
  const select = await knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
    .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
    .where('tipo','SAIDA')
    .whereNotNull('valorUnitario')
    .whereNot('valorUnitario', 0)
    .whereNotIn('I.Id', [869,1252, 315,1249,1247,1248])
    .whereBetween('data', [req.query.dataInicio,req.query.dataFim])
    .groupBy('I.nome')
  
  
 
  var fonts = {
    Courier: {
   normal: 'Courier',
   bold: 'Courier-Bold',
   italics: 'Courier-Oblique',
   bolditalics: 'Courier-BoldOblique'
 },
 Helvetica: {
   normal: 'Helvetica',
   bold: 'Helvetica-Bold',
   italics: 'Helvetica-Oblique',
   bolditalics: 'Helvetica-BoldOblique'
 },
 Times: {
   normal: 'Times-Roman',
   bold: 'Times-Bold',
   italics: 'Times-Italic',
   bolditalics: 'Times-BoldItalic'
 },
 Symbol: {
   normal: 'Symbol'
 },
 ZapfDingbats: {
   normal: 'ZapfDingbats'
 }
   };


   body = []
   for(let movimentacacao of select){
     rows = []
      rows.push(movimentacacao.nome)
     rows.push('R$'+parseFloat(movimentacacao.valorUnitario).toFixed(2).toString().replace(".", ","))
     rows.push(movimentacacao.quantidade)
     rows.push(movimentacacao.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) 
 
     body.push(rows) 
   
   }
   var docDefinition = {
     content: [{
       text:['Relatorio da Saida de estoque\n\n','Periodo: '+req.query.dataInicio+' - '+req.query.dataFim], style:'header',
     },
      { table: {
       widths: ['auto','auto','auto','auto'],
   
       body: [
         [ {text: "Item" , style: 'columnsTitle'},{text:"Valor Unitario", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'} ,{text: "Valor Total", style: 'columnsTitle'},],
         ...body
     
     ]
      },
      alignment: "center",
      layout: {hLineWidth: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 2 : 1;
     },
     vLineWidth: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 2 : 0;
     },
     hLineColor: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
     },
     vLineColor: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
     },}
   }
     ],
     defaultStyle: {
       font: 'Helvetica',
       fontSize: 11,
     
     },
     styles: {
       header: {
         font:'Courier',
         fontSize: 16,
         bold: true,
         alignment: "center",
         color:'gray'
     
     
       },
       columnsTitle: {
         fontSize: 13,
         bold: true,
         fillColor:"gray",
         color:'#fff',
         alignment:'center'
       
        }

     }
   };
 const printer =  new PdfPrinter(fonts);
 const pdfDoc = printer.createPdfKitDocument(docDefinition)
 const chunks = []
 pdfDoc.on("data", (chunk) => {
   chunks.push(chunk)
 })
pdfDoc.end();
 pdfDoc.on("end", () => {
   const result = Buffer.concat(chunks)
   res.end(result)
 })


})
app.get('/saldo/relatorio/insumos', async(req,res) => {
  
    
  const select = await knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
    .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
    .where('tipo','SAIDA')
    .whereBetween('m.data',[req.query.dataInicio,req.query.dataFim])
    .whereNotNull('valorUnitario')
    .whereIn('I.Id', [869,1252, 315,1249,1247,1248]) 
    .groupBy('I.nome')

  
  
 
  var fonts = {
    Courier: {
   normal: 'Courier',
   bold: 'Courier-Bold',
   italics: 'Courier-Oblique',
   bolditalics: 'Courier-BoldOblique'
 },
 Helvetica: {
   normal: 'Helvetica',
   bold: 'Helvetica-Bold',
   italics: 'Helvetica-Oblique',
   bolditalics: 'Helvetica-BoldOblique'
 },
 Times: {
   normal: 'Times-Roman',
   bold: 'Times-Bold',
   italics: 'Times-Italic',
   bolditalics: 'Times-BoldItalic'
 },
 Symbol: {
   normal: 'Symbol'
 },
 ZapfDingbats: {
   normal: 'ZapfDingbats'
 }
   };


   body = []
   for(let movimentacacao of select){
     rows = []
      rows.push(movimentacacao.nome)
     rows.push('R$'+parseFloat(movimentacacao.valorUnitario).toFixed(2).toString().replace(".", ","))
     rows.push(movimentacacao.quantidade)
     rows.push(movimentacacao.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) 
 
     body.push(rows) 
   
   }
   var docDefinition = {
     content: [{
       text:['Relatorio do consumo de insumos\n\n','Periodo: '+req.query.dataInicio+' - '+req.query.dataFim], style:'header',
     },
      { table: {
       widths: ['auto','auto','auto','auto','auto'],
   
       body: [
         [{text: "Mês", style: 'columnsTitle'}, {text: "Item" , style: 'columnsTitle'},{text:"Valor Unitario", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'} ,{text: "Valor Total", style: 'columnsTitle'},],
         ...body
     
     ]
      },
      alignment: "center",
      layout: {hLineWidth: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 2 : 1;
     },
     vLineWidth: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 2 : 0;
     },
     hLineColor: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
     },
     vLineColor: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
     },}
   }
     ],
     defaultStyle: {
       font: 'Helvetica',
       fontSize: 11,
     
     },
     styles: {
       header: {
         font:'Courier',
         fontSize: 16,
         bold: true,
         alignment: "center",
         color:'gray'
     
     
       },
       columnsTitle: {
         fontSize: 13,
         bold: true,
         fillColor:"gray",
         color:'#fff',
         alignment:'center'
       
        }

     }
   };
 const printer =  new PdfPrinter(fonts);
 const pdfDoc = printer.createPdfKitDocument(docDefinition)
 const chunks = []
 pdfDoc.on("data", (chunk) => {
   chunks.push(chunk)
 })
pdfDoc.end();
 pdfDoc.on("end", () => {
   const result = Buffer.concat(chunks)
   res.end(result)
 })})

 app.get('/saldo/relatorio/insumos/ano', async(req,res) => {
  
  ano =  [{
    "nome": 'Janeiro',
    "data_inicio": "2024-01-01",
    "data_fim": "2024-01-31"
    },{
    "nome": 'Fevereiro',
    "data_inicio": "2024-02-01",
    "data_fim": "2024-02-29"
    },{
        "nome": 'Março',
        "data_inicio": "2024-03-01",
        "data_fim": "2024-03-31"
        },{
    "nome": 'Abril',
    "data_inicio": "2024-04-01",
    "data_fim": "2024-04-30"
    },{
       "nome": 'Maio',
    "data_inicio": "2024-05-01",
    "data_fim": "2024-05-31"
     },{
        "nome": 'Junho',
    "data_inicio": "2024-06-01",
    "data_fim": "2024-06-30"
     },{
        "nome": 'Julho',
    "data_inicio": "2024-07-01",
    "data_fim": "2024-07-31"
     },{
        "nome": 'Agosto',
    "data_inicio": "2024-08-01",
    "data_fim": "2024-08-31"
     }, {
        "nome": 'Setembro',
    "data_inicio": "2024-09-01",
    "data_fim": "2024-09-30"
     },{
        "nome": 'Outubro',
    "data_inicio": "2024-10-01",
    "data_fim": "2024-10-31"
     }, {
        "nome": 'Novembro',
    "data_inicio": "2024-11-01",
    "data_fim": "2024-11-30"
     }, {
        "nome": 'Dezembro',
    "data_inicio": "2024-12-01",
    "data_fim": "2024-12-31"
     }]

     relatorioAno = []
    
     for(let mes of ano){
  const select = await knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
    .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
    .where('tipo','SAIDA')
    .whereBetween('m.data',[mes.data_inicio,mes.data_fim])
    .whereNotNull('valorUnitario')
    .whereIn('I.Id', [869,1252, 315,1249,1247,1248]) 
    .groupBy('I.nome')
    for(let dias of select){
      item = {
        valorUnitario: dias.valorUnitario,
        quantidade: dias.quantidade,
        nome: dias.nome,
        total: dias.total,
        mes: mes.nome
      }
    relatorioAno.push(item)
  }
  }
  
 
  var fonts = {
    Courier: {
   normal: 'Courier',
   bold: 'Courier-Bold',
   italics: 'Courier-Oblique',
   bolditalics: 'Courier-BoldOblique'
 },
 Helvetica: {
   normal: 'Helvetica',
   bold: 'Helvetica-Bold',
   italics: 'Helvetica-Oblique',
   bolditalics: 'Helvetica-BoldOblique'
 },
 Times: {
   normal: 'Times-Roman',
   bold: 'Times-Bold',
   italics: 'Times-Italic',
   bolditalics: 'Times-BoldItalic'
 },
 Symbol: {
   normal: 'Symbol'
 },
 ZapfDingbats: {
   normal: 'ZapfDingbats'
 }
   };


   body = []
   for(let movimentacacao of relatorioAno){
     rows = []
      rows.push(movimentacacao.mes )
      rows.push(movimentacacao.nome)
     rows.push('R$'+parseFloat(movimentacacao.valorUnitario).toFixed(2).toString().replace(".", ","))
     rows.push(movimentacacao.quantidade)
     rows.push(movimentacacao.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) 
 
     body.push(rows) 
   
   }
   var docDefinition = {
     content: [{
       text:'Relatorio do consumo de insumos\n\n', style:'header',
     },
      { table: {
       widths: ['auto','auto','auto','auto','auto'],
   
       body: [
         [{text: "Mês", style: 'columnsTitle'}, {text: "Item" , style: 'columnsTitle'},{text:"Valor Unitario", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'} ,{text: "Valor Total", style: 'columnsTitle'},],
         ...body
     
     ]
      },
      alignment: "center",
      layout: {hLineWidth: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 2 : 1;
     },
     vLineWidth: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 2 : 0;
     },
     hLineColor: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
     },
     vLineColor: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
     },}
   }
     ],
     defaultStyle: {
       font: 'Helvetica',
       fontSize: 11,
     
     },
     styles: {
       header: {
         font:'Courier',
         fontSize: 16,
         bold: true,
         alignment: "center",
         color:'gray'
     
     
       },
       columnsTitle: {
         fontSize: 13,
         bold: true,
         fillColor:"gray",
         color:'#fff',
         alignment:'center'
       
        }

     }
   };
 const printer =  new PdfPrinter(fonts);
 const pdfDoc = printer.createPdfKitDocument(docDefinition)
 const chunks = []
 pdfDoc.on("data", (chunk) => {
   chunks.push(chunk)
 })
pdfDoc.end();
 pdfDoc.on("end", () => {
   const result = Buffer.concat(chunks)
   res.end(result)
 })})
app.get('/saldo/relatorio/ano', async(req,res) => {
  
  ano =  [{
    "nome": 'Janeiro',
    "data_inicio": "2024-01-01",
    "data_fim": "2024-01-31"
    },{
    "nome": 'Fevereiro',
    "data_inicio": "2024-02-01",
    "data_fim": "2024-02-29"
    },{
        "nome": 'Março',
        "data_inicio": "2024-03-01",
        "data_fim": "2024-03-31"
        },{
    "nome": 'Abril',
    "data_inicio": "2024-04-01",
    "data_fim": "2024-04-30"
    },{
       "nome": 'Maio',
    "data_inicio": "2024-05-01",
    "data_fim": "2024-05-31"
     },{
        "nome": 'Junho',
    "data_inicio": "2024-06-01",
    "data_fim": "2024-06-30"
     },{
        "nome": 'Julho',
    "data_inicio": "2024-07-01",
    "data_fim": "2024-07-31"
     },{
        "nome": 'Agosto',
    "data_inicio": "2024-08-01",
    "data_fim": "2024-08-31"
     }, {
        "nome": 'Setembro',
    "data_inicio": "2024-09-01",
    "data_fim": "2024-09-30"
     },{
        "nome": 'Outubro',
    "data_inicio": "2024-10-01",
    "data_fim": "2024-10-31"
     }, {
        "nome": 'Novembro',
    "data_inicio": "2024-11-01",
    "data_fim": "2024-11-30"
     }, {
        "nome": 'Dezembro',
    "data_inicio": "2024-12-01",
    "data_fim": "2024-12-31"
     }]

     relatorioAno = []
    
     for(let mes of ano){
  const select = await knex('Movimentação as m').avg('valorUnitario as valorUnitario').sum('Quantidade as quantidade').select('I.nome', knex.raw('SUM("valorUnitario" * "Quantidade") as Total'))
    .leftJoin('Itens as I', 'm.codigoItem', 'I.Id')
    .where('tipo','SAIDA')
    .whereBetween('m.data',[mes.data_inicio,mes.data_fim])
    .whereNotNull('valorUnitario')
    .groupBy('I.nome')
    for(let dias of select){
      item = {
        valorUnitario: dias.valorUnitario,
        quantidade: dias.quantidade,
        nome: dias.nome,
        total: dias.total,
        mes: mes.nome
      }
    relatorioAno.push(item)
  }
  }
  
 
  var fonts = {
    Courier: {
   normal: 'Courier',
   bold: 'Courier-Bold',
   italics: 'Courier-Oblique',
   bolditalics: 'Courier-BoldOblique'
 },
 Helvetica: {
   normal: 'Helvetica',
   bold: 'Helvetica-Bold',
   italics: 'Helvetica-Oblique',
   bolditalics: 'Helvetica-BoldOblique'
 },
 Times: {
   normal: 'Times-Roman',
   bold: 'Times-Bold',
   italics: 'Times-Italic',
   bolditalics: 'Times-BoldItalic'
 },
 Symbol: {
   normal: 'Symbol'
 },
 ZapfDingbats: {
   normal: 'ZapfDingbats'
 }
   };


   body = []
   for(let movimentacacao of relatorioAno){
     rows = []
      rows.push(movimentacacao.mes )
      rows.push(movimentacacao.nome)
     rows.push('R$'+parseFloat(movimentacacao.valorUnitario).toFixed(2).toString().replace(".", ","))
     rows.push(movimentacacao.quantidade)
     rows.push(movimentacacao.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) 
 
     body.push(rows) 
   
   }
   var docDefinition = {
     content: [{
       text:'Relatorio da Saida de estoque\n\n', style:'header',
     },
      { table: {
       widths: ['auto','auto','auto','auto','auto'],
   
       body: [
         [{text: "Mês", style: 'columnsTitle'}, {text: "Item" , style: 'columnsTitle'},{text:"Valor Unitario", style: 'columnsTitle'},{text:"Quant", style: 'columnsTitle'} ,{text: "Valor Total", style: 'columnsTitle'},],
         ...body
     
     ]
      },
      alignment: "center",
      layout: {hLineWidth: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 2 : 1;
     },
     vLineWidth: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 2 : 0;
     },
     hLineColor: function (i, node) {
       return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
     },
     vLineColor: function (i, node) {
       return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
     },}
   }
     ],
     defaultStyle: {
       font: 'Helvetica',
       fontSize: 11,
     
     },
     styles: {
       header: {
         font:'Courier',
         fontSize: 16,
         bold: true,
         alignment: "center",
         color:'gray'
     
     
       },
       columnsTitle: {
         fontSize: 13,
         bold: true,
         fillColor:"gray",
         color:'#fff',
         alignment:'center'
       
        }

     }
   };
 const printer =  new PdfPrinter(fonts);
 const pdfDoc = printer.createPdfKitDocument(docDefinition)
 const chunks = []
 pdfDoc.on("data", (chunk) => {
   chunks.push(chunk)
 })
pdfDoc.end();
 pdfDoc.on("end", () => {
   const result = Buffer.concat(chunks)
   res.end(result)
 })


})

app.put('/saldo', (req,res) => {
  

  const update = knex.raw('Update  public."Saldo" set "quantidade" = "quantidade" - ? WHERE "Id" = (SELECT "Id" FROM "Saldo" WHERE  "codigoItem" = ? And "quantidade" != 0 ORDER BY "data" limit 1 )', [req.body.Quantidade,req.body.item.Id])
  update.then(data => {
       res.send(data)
  }).catch(error => {
    res.status(500).send(error)
  })

})

app.post('/saldo', (req,res) => {
  
  saldo = {
    "quantidade": req.body.Quantidade,
    "Unidade": req.body.unidade,
    "data": req.body.data,
    "codigoItem": req.body.item.Id,
    "Valor_unitario": req.body.valorUnitario
  }



  const insert = knex('Saldo')
  .insert(saldo)
  insert.then(data => {
       res.send(data)
  }).catch(error => {
    res.status(500).send(error)
  })

})

app.get('/estoque', (req,res) => {
  const select = knex('Estoque as E')
  .select('*')
  .orderBy('nome')
  .whereILike('nome','%'+req.query.filtro+'%' )
  select.then(data => {
       res.send(data)
  })

})
app.get('/estoque/relatorio',async(req,res) => {

  const select = await knex('Estoque')
  .select('*')
  .orderBy('nome')
  var fonts = {
    Courier: {
      normal: 'Courier',
      bold: 'Courier-Bold',
      italics: 'Courier-Oblique',
      bolditalics: 'Courier-BoldOblique'
    },
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    },
    Times: {
      normal: 'Times-Roman',
      bold: 'Times-Bold',
      italics: 'Times-Italic',
      bolditalics: 'Times-BoldItalic'
    },
    Symbol: {
      normal: 'Symbol'
    },
    ZapfDingbats: {
      normal: 'ZapfDingbats'
    }
    };


    body = []

    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);

    for(let movimentacacao of select){
      rows = []

      rows.push(movimentacacao.Id)
      rows.push(movimentacacao.nome)
      rows.push(movimentacacao.Quantidade)
      body.push(rows)  
    
    }
    var docDefinition = {
      content: [{
        columns: [{
        text:'Relatorio do estoque', style:'header'} ,{
        image: 'C:\\Users\\Portaria\\Workspace\\projeto-estoque\\src\\app\\core\\navbar\\LogoRosa.jpg',
        style:'logo',
        width: 180,
        margin: [0,0,5,8],
      },{text: 'Data: '+ today.toLocaleDateString()+'' , style:'data'}],
    },{ table: {
        body: [
          [{text: "Id", style: "columnsTitle"},{text: "Descrição", style: "columnsTitle"}, {text: "Quantidade", style: "columnsTitle"}],
          ...body]
       },alignment: "center",}
      ],
      defaultStyle: {
        font: 'Helvetica',
        header: {
          fontSize: 18
        }
      },
      styles: {
        header: {
          font: 'Courier',
          fontSize: 18,
          bold: true,
          alignment: "left",
          color:'gray'
        },
        data: {
          font: 'Courier',
          fontSize: 14,
          bold: true,
          alignment: "right",
          color:'gray'
        },
        logo: {
          alignment:"center"
        },
       columnsTitle: {
        fontSize: 15,
        bold: true,
        fillColor:"gray",
        color:'#fff',
        alignment: "center",
       }
      }
    };
  const printer =  new PdfPrinter(fonts);
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks = []
  pdfDoc.on("data", (chunk) => {
    chunks.push(chunk)
  })
pdfDoc.end();
  pdfDoc.on("end", () => {
    const result = Buffer.concat(chunks)
    res.end(result)
  })
  
})

app.put('/estoque',(req,res) => {

    
       if(req.body.tipo == 'ENTRADA'){
   const update = knex.raw('UPDATE  "Estoque" SET  "Quantidade"= "Quantidade" + ? WHERE "Id" = ?', [req.body.Quantidade,req.body.item.Id])
        update.then(data => res.send(data))
        .catch(error => res.status(500).send(error))
  }else if(req.body.tipo == 'SAIDA' ){
        const update = knex.raw('UPDATE  "Estoque" SET  "Quantidade"= "Quantidade" - ? WHERE "Id" = ?', [req.body.Quantidade,req.body.item.Id])
       update.then(data => res.send(data))
       .catch(error => res.status(500).send(error)) 
  } 
    
 })

 app.put('/estoque/edicao',(req,res) => {

  
  const select = knex('Movimentação as m')
  .select('Quantidade')
  .where('Id', req.body.Id)

       select.then(data => {
     if(req.body.Quantidade){
  
       if(req.body.tipo == 'ENTRADA'){
        const update = knex.raw('UPDATE  "Estoque" SET  "Quantidade"= "Quantidade" - ? WHERE "Id" = ?', [ data[0].Quantidade - req.body.Quantidade ,req.body.item.Id])
             update.then(data => res.send(data))
             .catch(error => res.status(500).send(error))
       }else if(req.body.tipo == 'SAIDA' ){
        const update = knex.raw('UPDATE  "Estoque" SET  "Quantidade"= "Quantidade" + ? WHERE "Id" = ?', [ data[0].Quantidade - req.body.Quantidade ,req.body.item.Id])
        update.then(data => res.send(data))
        .catch(error => res.status(500).send(error))
       } 
    
     }else{
       res.status(400).send('Faltado a quantidade')
      
     }
 })

     } 
)
 app.post('/estoque', (req,res) => {
  novoEstoque = {
     "nome": req.body.nome,
     "Quantidade": 0}

   const insertEstoque = knex('Estoque')
   .insert(novoEstoque)
  
    
   insertEstoque.then(data => {
    res.send(data)
   }).catch(error => {
    res.status(500).send(error)
   })
 
 })

app.get('/itens', (req,res) => {
  const select = knex('Itens')
  .select('*')
  .whereILike('nome','%'+req.query.filtro+'%' )
  .orderBy("nome")
  select.then(data => {
       res.send(data)
  })

})

app.post('/itens', (req,res) => {

  const insertItens = knex('Itens')
  .insert(req.body)
 
   insertItens.then(data => {
       res.send(data)
  }).catch(error => {
    res.status(500).send(error)
   })


})
app.get('/centroCusto', (req,res) => {
  const select = knex('CentroCusto')
  .select('*')
  .whereILike('nome','%'+req.query.filtro+'%' )
   .orderBy('nome')
  select.then(data => {
       res.send(data)
  })

})
app.post('/centroCusto', (req,res) => {
  const insert = knex('CentroCusto')
  .insert(req.body)

  insert.then(data => {
       res.send(data)
  })

})
app.get('/classificacao', (req,res) => {
  const select = knex('classificacao')
  .select('*')
  .whereILike('nome','%'+req.query.filtro+'%' )
  .orderBy('nome')
  select.then(data => {
       res.send(data)
  })

})

app.post('/classificacao', (req,res) => {
  const insert = knex('classificacao')
  .insert(req.body)

  insert.then(data => {
       res.send(data)
  })

})

app.get('/valoresUnitarios', (req,res) => {

  if(req.query.codigoItem !== undefined){
  const select = knex('Movimentação').select('valorUnitario')
  .where('codigoItem', req.query.codigoItem)
  .where('tipo','ENTRADA')
  .orderBy('data','desc')
  select.then(dados => {
    res.send(dados)
    
  })
  }else{
    res.status(400).send('Codigo Undefined')
  }
})



app.listen(port)

  