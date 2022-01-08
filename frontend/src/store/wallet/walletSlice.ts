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
  contractInfoState: ContractInfoState;
  userInfo?: UserInfo;

  isConnecting: boolean;
  isLoadingCollection: boolean;
  errorMessage?: string;
}

export interface ContractInfoState {
  isLoading: boolean;
  contractInfo?: ContractInfo;
  error?: string;
}

const initialState: WalletState = {
  isConnecting: false,
  isLoadingCollection: false,
  contractInfoState: {
    isLoading: false
  }
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setContractInfo: (state, action: PayloadAction<ContractInfo>) => {
      state.contractInfoState.contractInfo = action.payload;
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
    builder.addCase(loadStaticContractInfo.pending, (state) => {
      state.contractInfoState.isLoading = true;
    });
    builder.addCase(loadStaticContractInfo.fulfilled, (state, { payload }) => {
      state.contractInfoState.isLoading = false;
      state.contractInfoState.contractInfo = payload;
    });
    builder.addCase(loadStaticContractInfo.rejected, (state, { payload }) => {
      state.contractInfoState.isLoading = false;
      state.contractInfoState.error = payload as string;
    });
  }
});

interface InitializationResponse {
  connection?: ConnectionResponse;
  userInfo?: UserInfo;
}

export const loadStaticContractInfo = createAsyncThunk(
  'wallet/loadStaticContractInfo',
  async () => {
    return await getContractInfo();
  }
);

export const initialize = createAsyncThunk<
  InitializationResponse,
  void,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>('wallet/initialize', async (_, { getState, rejectWithValue, dispatch }) => {
  const isConnected = (await checkConnection()) ?? false;
  let connection: ConnectionResponse | undefined;
  let userInfo: UserInfo | undefined;
  if (isConnected) {
    connection = await connect();
    userInfo = await getUserInfo(connection.address);
  }
  return { connection, userInfo };
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
    if (address) {
      const userInfo = await getUserInfo(address);
      if (userInfo) {
        return { connection, userInfo } as ConnectWalletResponse;
      } else {
        return rejectWithValue('Could not connect');
      }
    } else {
      return rejectWithValue('Could not connect');
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
