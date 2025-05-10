import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// API URL
const API_URL = 'http://localhost:3000';

// Contexto de autenticación
const AuthContext = React.createContext();

// Componente de Login
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = React.useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      // La navegación se maneja en el contexto de autenticación
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Wallpaper App</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Componente de Registro
const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      Alert.alert('Éxito', 'Usuario registrado correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Registro</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Componente de Búsqueda
const SearchScreen = () => {
  const [keyword, setKeyword] = useState('');
  const [wallpapers, setWallpapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const { userToken } = React.useContext(AuthContext);

  useEffect(() => {
    fetchCategories();
    searchWallpapers();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const searchWallpapers = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/search?keyword=${keyword}`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setWallpapers(data);
    } catch (error) {
      console.error('Error al buscar wallpapers:', error);
      Alert.alert('Error', 'No se pudieron cargar los wallpapers');
    } finally {
      setLoading(false);
    }
  };

  const saveToFavorites = async (wallpaper_id) => {
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ wallpaper_id }),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar en favoritos');
      }
      
      Alert.alert('Éxito', 'Añadido a favoritos');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const downloadWallpaper = async (wallpaper_id, image_path) => {
    try {
      // Aquí iría la lógica para descargar la imagen al dispositivo
      
      // Registrar la descarga en el servidor
      await fetch(`${API_URL}/wallpapers/${wallpaper_id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      Alert.alert('Éxito', 'Wallpaper descargado correctamente');
    } catch (error) {
      console.error('Error al descargar:', error);
      Alert.alert('Error', 'No se pudo descargar el wallpaper');
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.name && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderWallpaperItem = ({ item }) => (
    <View style={styles.wallpaperItem}>
      <Image 
        source={{ uri: item.image_path }} 
        style={styles.wallpaperImage} 
        resizeMode="cover"
      />
      <View style={styles.wallpaperInfo}>
        <Text style={styles.wallpaperTitle}>{item.title}</Text>
        <Text style={styles.wallpaperCategory}>{item.category_name}</Text>
        <Text style={styles.wallpaperResolution}>{item.resolution}</Text>
        <View style={styles.wallpaperActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => saveToFavorites(item.wallpaper_id)}
          >
            <Icon name="favorite-border" size={24} color="#FF5252" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => downloadWallpaper(item.wallpaper_id, item.image_path)}
          >
            <Icon name="file-download" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar wallpapers..."
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={searchWallpapers}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchWallpapers}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.category_id}
        style={styles.categoriesList}
        showsHorizontalScrollIndicator={false}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : (
        <FlatList
          data={wallpapers}
          renderItem={renderWallpaperItem}
          keyExtractor={item => item.wallpaper_id}
          contentContainerStyle={styles.wallpapersList}
        />
      )}
    </SafeAreaView>
  );
};

// Componente de Favoritos
const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userToken } = React.useContext(AuthContext);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener favoritos');
      }
      
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (wallpaper_id) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${wallpaper_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar de favoritos');
      }
      
      // Actualizar la lista de favoritos
      setFavorites(favorites.filter(item => item.wallpaper_id !== wallpaper_id));
      Alert.alert('Éxito', 'Eliminado de favoritos');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.wallpaperItem}>
      <Image 
        source={{ uri: item.image_path }} 
        style={styles.wallpaperImage} 
        resizeMode="cover"
      />
      <View style={styles.wallpaperInfo}>
        <Text style={styles.wallpaperTitle}>{item.title}</Text>
        <Text style={styles.wallpaperCategory}>{item.category_name}</Text>
        <Text style={styles.wallpaperResolution}>{item.resolution}</Text>
        <View style={styles.wallpaperActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => removeFromFavorites(item.wallpaper_id)}
          >
            <Icon name="delete" size={24} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Mis Favoritos</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={item => item.wallpaper_id}
          contentContainerStyle={styles.wallpapersList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="favorite-border" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No tienes wallpapers favoritos</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// Componente de Perfil
const ProfileScreen = () => {
  const { signOut } = React.useContext(AuthContext);
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Mi Perfil</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Navegación
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navegación principal (tabs)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Search') {
          iconName = 'search';
        } else if (route.name === 'Favorites') {
          iconName = 'favorite';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }
        
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: '#6200EE',
      inactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen 
      name="Search" 
      component={SearchScreen} 
      options={{ title: 'Buscar' }}
    />
    <Tab.Screen 
      name="Favorites" 
      component={FavoritesScreen} 
      options={{ title: 'Favoritos' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Perfil' }}
    />
  </Tab.Navigator>
);

// App principal
const App = () => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            userToken: action.token,
            isSignout: false,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            userToken: null,
            isSignout: true,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      
      try {
        userToken = await AsyncStorage.getItem('userToken');
      } catch (e) {
        console.error('Error al restaurar token:', e);
      }
      
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (data) => {
        try {
          const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Error al iniciar sesión');
          }
          
          await AsyncStorage.setItem('userToken', result.token);
          dispatch({ type: 'SIGN_IN', token: result.token });
        } catch (error) {
          throw error;
        }
      },
      signOut: async () => {
        await AsyncStorage.removeItem('userToken');
        dispatch({ type: 'SIGN_OUT' });
      },
      userToken: state.userToken,
    }),
    [state.userToken]
  );

  if (state.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.userToken == null ? (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen} 
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen 
              name="Main" 
              component={MainTabs} 
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#6200EE',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: '#6200EE',
    textAlign: 'center',
    marginTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    maxHeight: 50,
    paddingHorizontal: 15,
  },
  categoryItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selecte