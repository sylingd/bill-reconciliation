import './index.css';
import Bill from './sections/bill';
import Record from './sections/record';
import Result from './sections/result';
import { Context, useModel } from './store';

const Index = () => {
  const model = useModel();

  return (
    <Context.Provider value={model}>
      <Bill />
      <Record />
      <Result />
    </Context.Provider>
  );
};

export default Index;
