import { useContext } from 'react';
import { WavelengthContext } from '../context/wavelengthContext.base';

export const useWavelength = () => {
  const context = useContext(WavelengthContext);
  if (context === undefined) {
    throw new Error('useWavelength must be used within a WavelengthProvider');
  }

  const {
    activeWavelengths,
    wavelength,
    loading,
    fetchTrendingWavelengths,
    tuneIn,
    tuneOut,
    createPost,
    setActiveWavelength,
  } = context;

  // Helper function to determine if a wavelength can be tuned into
  const canTuneIn = (wavelengthId) => {
    if (!wavelengthId) return false;
    const now = new Date();
    const wavelength = activeWavelengths?.find(w => w.id === wavelengthId);
    if (!wavelength) return true; // If not found in active wavelengths, assume it can be tuned into
    return new Date(wavelength.expires_at) > now;
  };

  // Wrap mutations to handle common error cases
  const handleTuneIn = async (wavelengthId) => {
    try {
      await tuneIn.mutateAsync(wavelengthId);
      return { success: true };
    } catch (error) {
      return { 
        error: error.message || 'Failed to tune in. Please try again.' 
      };
    }
  };

  const handleTuneOut = async (wavelengthId) => {
    try {
      await tuneOut.mutateAsync(wavelengthId);
      return { success: true };
    } catch (error) {
      return { 
        error: error.message || 'Failed to tune out. Please try again.' 
      };
    }
  };

  const handleCreatePost = async (wavelengthId, content) => {
    try {
      const post = await createPost.mutateAsync({ wavelengthId, content });
      return { data: post };
    } catch (error) {
      return { 
        error: error.message || 'Failed to create post. Please try again.' 
      };
    }
  };

  return {
    activeWavelengths,
    wavelength,
    loading,
    fetchTrendingWavelengths,
    tuneIn: handleTuneIn,
    tuneOut: handleTuneOut,
    createPost: handleCreatePost,
    canTuneIn,
    setActiveWavelength,
    // Expose mutation states for UI feedback
    isTuningIn: tuneIn.isLoading,
    isTuningOut: tuneOut.isLoading,
    isPosting: createPost.isLoading,
  };
};
