/**
 * PERF-6: cached remote images with optional CDN resize query params.
 * Local require() sources still use RN Image (FastImage is for network).
 */
import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

export type CachedRemoteImageProps = {
  uri?: string | null;
  /** Local require(...) fallback when uri is empty */
  fallback?: ImageProps['source'];
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  /** Request width for CDN resize (appended as w= when URL has no query) */
  cdnWidth?: number;
  /** Request height for CDN resize */
  cdnHeight?: number;
};

/** Append common CDN resize hints (Cloudinary-style / generic w/h) without breaking existing paths. */
export function withCdnResize(
  uri: string,
  opts?: { width?: number; height?: number },
): string {
  if (!uri || !uri.startsWith('http')) return uri;
  try {
    const u = new URL(uri);
    if (opts?.width) u.searchParams.set('w', String(opts.width));
    if (opts?.height) u.searchParams.set('h', String(opts.height));
    // common auto format hint (ignored by servers that don't support it)
    if (!u.searchParams.has('fm')) u.searchParams.set('fm', 'webp');
    return u.toString();
  } catch {
    return uri;
  }
}

const CachedRemoteImage: React.FC<CachedRemoteImageProps> = ({
  uri,
  fallback,
  style,
  resizeMode = 'cover',
  cdnWidth,
  cdnHeight,
}) => {
  if (uri && typeof uri === 'string' && uri.startsWith('http')) {
    const source: Source = {
      uri: withCdnResize(uri, { width: cdnWidth, height: cdnHeight }),
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    };
    const mode =
      resizeMode === 'contain'
        ? FastImage.resizeMode.contain
        : resizeMode === 'stretch'
          ? FastImage.resizeMode.stretch
          : resizeMode === 'center'
            ? FastImage.resizeMode.center
            : FastImage.resizeMode.cover;
    return (
      <FastImage
        style={style as FastImageProps['style']}
        source={source}
        resizeMode={mode}
      />
    );
  }
  return (
    <Image
      style={style}
      source={fallback || { uri: uri || undefined }}
      resizeMode={resizeMode}
    />
  );
};

export default CachedRemoteImage;
