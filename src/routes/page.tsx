import './index.css';
import Bill from './sections/bill';
import { Context, useModel } from './store';

const Index = () => {
  const model = useModel();

  return (
    <Context.Provider value={model}>
      <Bill />
    </Context.Provider>
  );
};

export default Index;
