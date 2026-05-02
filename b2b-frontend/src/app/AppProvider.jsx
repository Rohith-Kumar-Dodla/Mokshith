import { Provider } from 'react-redux';
import { store } from './store.js';
import { SocketProvider } from '../context/SocketContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';

const AppProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </NotificationProvider>
    </Provider>
  );
};

export default AppProvider;
