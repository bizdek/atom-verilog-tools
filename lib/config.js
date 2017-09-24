'use babel'


export default{
  headerFile:{
    title:'Header for verilog files',
    description:'File containing header for header insert functionality.',
    type:'string',
    default:'Filepath'
  },
  silent:{
    title:'Silent mode',
    description:'If enabled, only warning notifications will be shown.',
    type:'boolean',
    default: false
  }
};
