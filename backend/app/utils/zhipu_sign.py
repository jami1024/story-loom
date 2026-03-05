import hashlib
import time
import uuid

from app.core.config import get_settings


def generate_timestamp() -> str:
    """
    生成特殊处理的时间戳

    对应JS代码：
    function U() {
        const e = Date.now()
        const A = e.toString()
        const t = A.length
        const o = A.split("").map((e => Number(e)))
        const i = o.reduce(((e, A) => e + A), 0) - o[t - 2]
        const a = i % 10
        return A.substring(0, t - 2) + a + A.substring(t - 1, t)
    }
    """
    # 获取当前时间戳（毫秒）
    timestamp_ms = int(time.time() * 1000)
    timestamp_str = str(timestamp_ms)
    length = len(timestamp_str)

    # 将时间戳字符串转为数字列表
    digits = [int(d) for d in timestamp_str]

    # 计算所有数字的和，减去倒数第二位数字
    digit_sum = sum(digits) - digits[length - 2]

    # 取模10
    new_digit = digit_sum % 10

    # 替换倒数第二位数字
    result = timestamp_str[:length - 2] + str(new_digit) + timestamp_str[length - 1:]

    return result


def generate_nonce() -> str:
    """
    生成随机nonce（UUID v4去掉横杠）

    对应JS代码：
    function M() {
        return (n.h.genV4() + "").replace(/-/g, "")
    }
    """
    return uuid.uuid4().hex


def generate_sign(timestamp: str = None, nonce: str = None) -> dict:
    """
    生成签名

    对应JS代码：
    function S() {
        const e = U()
        const A = M();
        return {
            timestamp: e,
            xNonce: A,
            sign: r()(`${e}-${A}-8a1317a7468aa3ad86e997d08f3f31cb`)
        }
    }

    Args:
        timestamp: 时间戳（可选，不传则自动生成）
        nonce: 随机数（可选，不传则自动生成）

    Returns:
        包含 timestamp, xNonce, sign 的字典
    """
    # 生成时间戳和nonce
    if timestamp is None:
        timestamp = generate_timestamp()

    if nonce is None:
        nonce = generate_nonce()

    # 构造签名字符串
    sign_string = f"{timestamp}-{nonce}-{get_settings().ZHIPU_SIGN_SECRET}"

    # 计算MD5
    sign = hashlib.md5(sign_string.encode()).hexdigest()

    return {
        "timestamp": timestamp,
        "xNonce": nonce,
        "sign": sign
    }


def get_signed_headers(custom_headers: dict = None) -> dict:
    """
    获取包含签名的完整请求头

    Args:
        custom_headers: 自定义额外的请求头

    Returns:
        包含签名的请求头字典
    """
    # 生成签名
    sign_data = generate_sign()

    # 构造请求头
    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "App-Name": "chatglm",
        "X-Device-Id": "your-device-id",  # TODO: 可以固定或随机生成
        "X-App-Platform": "pc",
        "X-App-Version": "0.0.1",
        "X-Timestamp": sign_data["timestamp"],
        "X-Nonce": sign_data["xNonce"],
        "X-Sign": sign_data["sign"],
    }

    # 合并自定义请求头
    if custom_headers:
        headers.update(custom_headers)

    return headers


if __name__ == "__main__":
    # 测试签名生成
    print("=" * 60)
    print("签名生成测试")
    print("=" * 60)

    # 生成签名
    result = generate_sign()

    print("\n生成的签名信息:")
    print(f"Timestamp: {result['timestamp']}")
    print(f"Nonce:     {result['xNonce']}")
    print(f"Sign:      {result['sign']}")

    # 验证签名字符串
    print(f"\n签名原文: {result['timestamp']}-{result['xNonce']}-{get_settings().ZHIPU_SIGN_SECRET}")

    # 生成完整请求头
    print("\n完整请求头:")
    headers = get_signed_headers()
    for key, value in headers.items():
        print(f"  {key}: {value}")
