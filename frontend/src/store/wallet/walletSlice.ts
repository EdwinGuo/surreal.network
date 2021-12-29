import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from '../../app/store';
import {
  checkConnection,
  Collection,
  connect,
  ConnectionResponse,
  ContractInfo,
  getContractInfo,
  getOwnedFromCollection,
  getUserInfo,
  UserInfo
} from '../../services/wallet';

export interface WalletState {
  connection?: ConnectionResponse;
  contractInfo?: ContractInfo;
  userInfo?: UserInfo;
  isConnecting: boolean;
  isLoadingCollection: boolean;
  errorMessage?: string;
}

const initialState: WalletState = {
  isConnecting: false,
  isLoadingCollection: false
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setContractInfo: (state, action: PayloadAction<ContractInfo>) => {
      state.contractInfo = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
    },
    setConnection: (state, action: PayloadAction<ConnectionResponse>) => {
      state.connection = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialize.fulfilled, (state, { payload }) => {
      state.connection = payload.connection;
      state.contractInfo = payload.contractInfo;
      state.userInfo = payload.userInfo;
    });
    builder.addCase(connectWallet.pending, (state, { payload }) => {
      state.isConnecting = true;
    });
    builder.addCase(connectWallet.rejected, (state, { payload, error }) => {
      state.isConnecting = false;
      state.errorMessage = payload as string;
    });
    builder.addCase(connectWallet.fulfilled, (state, { payload }) => {
      state.isConnecting = false;
      state.connection = payload?.connection;
      state.userInfo = payload?.userInfo;
    });
    builder.addCase(selectCollection.fulfilled, (state, { payload }) => {
      state.isLoadingCollection = false;
      state.userInfo = payload;
    });
    builder.addCase(selectCollection.rejected, (state, { payload, error }) => {
      state.isLoadingCollection = false;
      state.errorMessage = payload as string;
    });
    builder.addCase(selectCollection.pending, (state, { payload }) => {
      state.isLoadingCollection = true;
    });
  }
});

interface InitializationResponse {
  contractInfo: ContractInfo;
  connection?: ConnectionResponse;
  userInfo?: UserInfo;
}
export const initialize = createAsyncThunk<
  InitializationResponse,
  void,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>('wallet/initialize', async (_, { getState, rejectWithValue, dispatch }) => {
  const contractInfo = await getContractInfo();
  const isConnected = (await checkConnection()) ?? false;
  let connection: ConnectionResponse | undefined;
  let userInfo: UserInfo | undefined;
  if (isConnected && contractInfo) {
    connection = await connect();
    userInfo = await getUserInfo(connection.address, contractInfo);
  }
  return { contractInfo, connection, userInfo };
});

interface ConnectWalletResponse {
  connection: ConnectionResponse;
  userInfo: UserInfo;
}

export const connectWallet = createAsyncThunk(
  'wallet/connect',
  async (_, { getState, rejectWithValue, dispatch }) => {
    const connection = await connect();
    const address = connection?.address;
    const { contractInfo } = (getState() as RootState).wallet;
    if (address && contractInfo) {
      const userInfo = await getUserInfo(address, contractInfo);
      if (userInfo) {
        return { connection, userInfo } as ConnectWalletResponse;
      } else {
        rejectWithValue('Could not connect');
      }
    } else {
      rejectWithValue('Could not connect');
    }
  }
);

export const selectCollection = createAsyncThunk<
  UserInfo,
  Collection,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>(
  'wallet/collection/select',
  async (collection, { getState, rejectWithValue, dispatch }) => {
    try {
      const { userInfo } = (getState() as RootState).wallet;
      if (userInfo === undefined) {
        return rejectWithValue('Unexpected error');
      }
      const ownedCollectionTokens = await getOwnedFromCollection(collection);
      const updatedUserInfo: UserInfo = {
        ...userInfo,
        selectedCollection: collection,
        ownedCollectionTokens
      };
      return updatedUserInfo;
    } catch (error) {
      return rejectWithValue('Could not get collection');
    }
  }
);

// Action creators are generated for each case reducer function
export const { setContractInfo, setUserInfo, setConnection } =
  walletSlice.actions;

export default walletSlice.reducer;
