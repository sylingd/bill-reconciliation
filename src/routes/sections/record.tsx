import { useStore } from '../store';

const Record = () => {
  const { billData, recordStatus, formApi, formOnChange } = useStore();

  console.log(billData, recordStatus, formApi, formOnChange);
};

export default Record;
