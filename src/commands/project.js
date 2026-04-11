import projectModel from '../models/project.js';

const json = data => console.log(JSON.stringify(data));

export const list = async () => {
  const projects = await projectModel.listAll();
  json(projects.map(p => ({id: p.id, name: p.name})));
};
