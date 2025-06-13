import './index.less';
import Edit from './sections/edit';
import Result from './sections/result';
import { Context, useModel } from './store';

const Index = () => {
  const model = useModel();

  return (
    <Context.Provider value={model}>
      <Edit />
      <Result />
    </Context.Provider>
  );
};

export default Index;
